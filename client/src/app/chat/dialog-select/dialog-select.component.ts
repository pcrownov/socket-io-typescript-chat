import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'tcc-dialog-select',
  templateUrl: './dialog-select.component.html',
  styleUrls: ['./dialog-select.component.css']
})
export class DialogSelectComponent implements OnInit {
  selectedUUID = null;

  constructor(public dialogRef: MatDialogRef<DialogSelectComponent>,
    @Inject(MAT_DIALOG_DATA) public params: any) {
  }

  ngOnInit() {
  }

  public onItemClick(event:Event, uuid:String):void {
    this.selectedUUID = uuid;
  }

  public selectItem():void {
    this.dialogRef.close({
      selectedUUID: this.selectedUUID
    });
  }

  public isItemSelected():boolean {
    return this.selectedUUID != null;
  }
}
