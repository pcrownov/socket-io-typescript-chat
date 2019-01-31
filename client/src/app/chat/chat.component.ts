import { Component, OnInit, ViewChildren, ViewChild, AfterViewInit, QueryList, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MatList, MatListItem } from '@angular/material';

import { Action } from './shared/model/action';
import { Event } from './shared/model/event';
import { Message } from './shared/model/message';
import { User } from './shared/model/user';
import { SocketService } from './shared/services/socket.service';
import { DialogUserComponent } from './dialog-user/dialog-user.component';
import { DialogUserType } from './dialog-user/dialog-user-type';
import {Select} from "./shared/model/select";
import {DialogSelectComponent} from "./dialog-select/dialog-select.component";


const AVATAR_URL = 'https://api.adorable.io/avatars/285';

@Component({
  selector: 'tcc-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewInit {
  action = Action;
  user: User;
  messages: Message[] = [];
  messageContent: string;
  ioConnection: any;
  liveConnection: any;
  nodeConnection: any;
  selConnection: any;
  lastId: String = null;
  dialogRef: MatDialogRef<DialogUserComponent> | null;
  selectDialogRef: MatDialogRef<DialogSelectComponent> | null;
  defaultDialogUserParams: any = {
    disableClose: true,
    data: {
      title: 'Welcome',
      dialogType: DialogUserType.NEW
    }
  };

  // getting a reference to the overall list, which is the parent container of the list items
  @ViewChild(MatList, { read: ElementRef }) matList: ElementRef;

  // getting a reference to the items/messages within the list
  @ViewChildren(MatListItem, { read: ElementRef }) matListItems: QueryList<MatListItem>;

  constructor(private socketService: SocketService,
    public dialog: MatDialog) { }

  ngOnInit(): void {
    this.initModel();
    // Using timeout due to https://github.com/angular/angular/issues/14748
    setTimeout(() => {
      this.openUserPopup(this.defaultDialogUserParams);
    }, 0);
  }

  ngAfterViewInit(): void {
    // subscribing to any changes in the list of items / messages
    this.matListItems.changes.subscribe(elements => {
      this.scrollToBottom();
    });
  }

  // auto-scroll fix: inspired by this stack overflow post
  // https://stackoverflow.com/questions/35232731/angular2-scroll-to-bottom-chat-style
  private scrollToBottom(): void {
    try {
      this.matList.nativeElement.scrollTop = this.matList.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  private initModel(): void {
    const randomId = this.getRandomId();
    this.user = {
      id: randomId,
      avatar: `${AVATAR_URL}/${randomId}.png`
    };
  }

  private initIoConnection(): void {
    this.socketService.initSocket();

    this.liveConnection = this.socketService.onLive()
      .subscribe((live:boolean) => {
        console.log("Alive: " + live);
      });

    this.nodeConnection = this.socketService.onNode()
      .subscribe((node:Object) => {
          let entry = JSON.parse(node.toString())["entry"];
          console.log(entry);
          let m = {};
          let n = {};
          n["name"] = entry["name"];
          n["id"] = entry["id"];
          n["type"] = entry.isFile ? "File": "Folder";
          if(entry["properties"] != null) {
            n["description"] = entry["properties"]["cm:description"];
          }

          m["node"] = n;
          m["action"] = Action.NODE;
          m["from"] = this.user;
          this.messages.push(m);
      });

    this.ioConnection = this.socketService.onMessage()
      .subscribe((message: Message) => {
        this.messages.push(message);
      });

    this.selConnection = this.socketService.onSelect()
      .subscribe((select:Select) => {
        //don't show if it's not for your message
        if(select.id !== this.lastId) {
            return;
        }
        //show user selection;
        console.log("Got Selection")
        this.openSelectionPopup({
          data: {
            "list": select.list,
            "title": "Please Select Item"
          }
        })
      });

    this.socketService.onEvent(Event.CONNECT)
      .subscribe(() => {
        console.log('connected');
      });

    this.socketService.onEvent(Event.DISCONNECT)
      .subscribe(() => {
        console.log('disconnected');
      });
  }

  private getRandomId(): number {
    return Math.floor(Math.random() * (1000000)) + 1;
  }

  public onClickUserInfo() {
    this.openUserPopup({
      data: {
        username: this.user.name,
        title: 'Edit Details',
        dialogType: DialogUserType.EDIT
      }
    });
  }

  private openSelectionPopup(params): void {
    this.selectDialogRef = this.dialog.open(DialogSelectComponent, params);
    this.selectDialogRef.afterClosed().subscribe(response => {
      if(!response) {
        return;
      }

      let message:string = "selectNode:" + response.selectedUUID;
      this.sendMessage(message);
    })
  }

  private openUserPopup(params): void {
    this.dialogRef = this.dialog.open(DialogUserComponent, params);
    this.dialogRef.afterClosed().subscribe(paramsDialog => {
      if (!paramsDialog) {
        return;
      }

      this.user.name = paramsDialog.username;
      if (paramsDialog.dialogType === DialogUserType.NEW) {
        this.initIoConnection();
        this.sendNotification(paramsDialog, Action.JOINED);
      } else if (paramsDialog.dialogType === DialogUserType.EDIT) {
        this.sendNotification(paramsDialog, Action.RENAME);
      }
    });
  }

  public sendMessage(message: string): void {
    if (!message) {
      return;
    }

    this.lastId = this.generateTimestampID();

    this.socketService.send({
      id: this.lastId,
      from: this.user,
      content: message
    });
    this.messageContent = null;
  }

  private generateTimestampID(): String {
      return new Date().getTime().toString();
  }

  public sendNotification(params: any, action: Action): void {
    let message: Message;

    if (action === Action.JOINED) {
      message = {
        from: this.user,
        action: action
      }
    } else if (action === Action.RENAME) {
      message = {
        action: action,
        content: {
          username: this.user.name,
          previousUsername: params.previousUsername
        }
      };
    }

    this.socketService.send(message);
  }
}
