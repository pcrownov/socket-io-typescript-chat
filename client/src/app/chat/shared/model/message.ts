import {User} from './user';
import {Action} from './action';
import {AlfNode} from "./alf-node";

export interface Message {
    id?: String;
    from?: User;
    content?: any;
    action?: Action;
    node?: AlfNode;
}
