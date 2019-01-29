import { createServer, Server } from 'http';
import * as express from 'express';
import * as socketIo from 'socket.io';
import * as request from 'request';

import {Message, User, Select, AlfDocument} from './model';

export class ChatServer {
    private static KEY_SEARCH_CHARACTER = "#search";
    private static KEY_NODE_CHARACTER = "selectNode:";
    private static KEY_MODIFIED = "modified";
    private static KEY_TITLE = "title";
    private static QUERY_STRING_TEMPLATE = "cm:%%%field%%%:%%%value%%%";
    private static ALFRESCO_BASE_URL = "http://admin:admin@localhost:8080";
    private static SEARCH_URL_BASE = "/alfresco/api/-default-/public/search/versions/1/search";
    private static NODE_INFO_BASE = "/alfresco/api/-default-/public/alfresco/versions/1/nodes/";
    public static readonly PORT:number = 8085;
    private app: express.Application;
    private server: Server;
    private io: SocketIO.Server;
    private port: string | number;

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private config(): void {
        this.port = process.env.PORT || ChatServer.PORT;
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    private listen(): void {
        let _this = this;
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });

        this.io.on('connect', (socket: any) => {
            console.log('Connected client on port %s.', this.port);
            socket.on('message', (m: Message) => {
                let content:String = m["content"];
                console.log('[server](message): %s', JSON.stringify(m));
                //check if message starts with our key
                if(content != null && content.toLowerCase().indexOf(ChatServer.KEY_SEARCH_CHARACTER) == 0) {
                    //cut head off of message
                    let searchStr:String = content.substring(ChatServer.KEY_SEARCH_CHARACTER.length);
                    //try to get type and value
                    searchStr = searchStr.trim();
                    let type = null;
                    let value = null;
                    try {
                        type = searchStr.substring(0, searchStr.indexOf(":"));
                        value = searchStr.substring(searchStr.indexOf(":") + 1);
                    } catch (e) {
                        console.log("Error getting type and value: " + e);
                        return;
                    }

                    if(type == null || value == null) {
                        console.log("Cannot search with null type or value");
                        return;
                    }

                    if(value.indexOf("*") != 0 || value.lastIndexOf("*") != value.length()) {
                        value = "*" + value + "*";
                    }

                    //generate body
                    let searchBody = {};
                    if(type.toLowerCase() === ChatServer.KEY_MODIFIED) {
                        let sortObj = this.generateSortObject("cm:modifiedAt", false);
                        let sortArray = null;
                        if(sortObj != null) {
                            sortArray = [sortObj];
                        }
                        searchBody = this.generateQueryBody(type, value, sortArray);
                    } else if(type.toLowerCase() === ChatServer.KEY_TITLE) {
                        searchBody = this.generateQueryBody(type, value, null);
                    }

                    if(searchBody == null) {
                        console.log("Cannot search with and empty query body");
                        return;
                    }

                    //call search endpoint with body
                    this.getSearchResults(searchBody)
                        .then( function(result:Object) {
                            _this.io.emit('select', result);
                        });
                } else if(content != null && content.indexOf(ChatServer.KEY_NODE_CHARACTER) == 0) {
                    let searchNode:String = content.substring(ChatServer.KEY_NODE_CHARACTER.length);

                    this.getNodeInfo(searchNode)
                        .then(function(result:Object) {
                            _this.io.emit("node", result);
                        });
                }
                else {
                    this.io.emit('message', m);
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });
    }

    public getApp(): express.Application {
        return this.app;
    }

    private getNodeInfo(nodeId:String) {
        return new Promise<Object>((resolve, reject) => {
            request.get({
                "uri": ChatServer.ALFRESCO_BASE_URL + ChatServer.NODE_INFO_BASE + nodeId
            }, (error, res, body) => {
                if (error != null) {
                    reject(error);
                }

                if (body == null) {
                    resolve(null)
                }

                resolve(body);
            });
        });
    }

    private getSearchResults(queryBody:Object) {
        return new Promise<Object>((resolve, reject) => {
            request.post({"uri": ChatServer.ALFRESCO_BASE_URL + ChatServer.SEARCH_URL_BASE, "json": queryBody }, (error, res, body) => {
                if(error != null) {
                    reject(error);
                }

                if(body == null || body["list"] == null || body["list"]["entries"] == null) {
                    resolve(null)
                }


                //return search result set to user for choice/verification
                let selectSet:Array<Object> = new Array<Object>();
                let entries = body["list"]["entries"];

                for(let i = 0; i < entries.length; i++) {
                    let entry = entries[i]["entry"];
                    let name:String = entry["name"];
                    let id:String = entry["id"];

                    let d:AlfDocument = new AlfDocument(id, name);
                    selectSet.push(d);
                }

                let sm:Select = new Select(selectSet);
                resolve(sm);
            });
        });
    }

    private generateQueryBody(field: String, value: String, sortSet:Array<Object>):Object{
        let body = {
            "paging": {
                "maxItems":"10"
            },
            "query": {},
            "sort": Array<Object>()
        };

        let query:String = ChatServer.QUERY_STRING_TEMPLATE.replace(/%%%field%%%/g, field.toString())
            .replace(/%%%value%%%/g, value.toString());
        body["query"] = {"query": query};

        if(sortSet) {
            body["sort"] = sortSet;
        }

        return body;
    }

    private generateSortObject(field: String, ascending:boolean) {
        return {"FIELD": field, "ascending": ascending}
    }
}
