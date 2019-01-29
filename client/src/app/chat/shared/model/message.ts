import {User} from './user';
import {Action} from './action';
import {AlfNode} from "./alf-node";

export interface Message {
    from?: User;
    content?: any;
    action?: Action;
    node?: AlfNode;
}
