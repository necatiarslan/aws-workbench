import { NodeBase } from '../../tree/NodeBase';
import { Serialize } from '../../common/serialization/Serialize';
import { NodeRegistry } from '../../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { TreeState } from '../../tree/TreeState';
import { S3Explorer } from './S3Explorer';
import { Session } from '../../common/Session';

export class S3BucketNode extends NodeBase {

    constructor(BucketName: string, parent?: NodeBase) 
    {
        super(BucketName, parent);

        this.BucketName = BucketName;
        this.Icon = "aws-s3-bucket";
        // if(Key) {this.label = Key}

        // this.Icon = Key ? Key.endsWith("/") ? "folder" : "file" : "aws-s3-bucket";
        // this.Key = Key ?? "";

        this.EnableNodeRemove = true;
        this.EnableNodeView = true;
        this.SetContextValue();
    }

    @Serialize()
    public BucketName: string = "";

    @Serialize()
    public Key: string = "";

    public async NodeAdd(): Promise<void> {

    }

    public NodeRemove(): void {
        this.Remove();
        TreeState.save();
    }

    public IsShortcutExists(bucket:string, key:string):boolean
    {
        key = key ?? "";
        return this.Children.some(x => (x as S3BucketNode).BucketName === bucket && (x as S3BucketNode).Key === key) ?? false;
    }

    public AddShortcut(bucket:string, key:string):void
    {
        new S3BucketNode(bucket, this).Key = key;
        TreeState.save();
    }

    public RemoveShortcut(bucket:string, key:string | undefined):void
    {
        key = key ?? "";
        this.Children.forEach(x => {
            if((x as S3BucketNode).BucketName === bucket && (x as S3BucketNode).Key === key)
            {
                x.Remove();
            }
        });
        TreeState.save();
    }

    public NodeRefresh(): void {
    }

    public NodeView(): void {
        S3Explorer.Render(Session.Current.ExtensionUri, this);
    }

    public async NodeEdit(): Promise<void> {
          
    }

    public NodeRun(): void {
        
    }

    public NodeStop(): void {
    }

    public NodeOpen(): void {
    }

    public NodeInfo(): void {
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('S3BucketNode', S3BucketNode);