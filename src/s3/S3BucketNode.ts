import { NodeBase } from '../tree/NodeBase';
import { Serialize } from '../common/serialization/Serialize';
import { NodeRegistry } from '../common/serialization/NodeRegistry';
import * as vscode from 'vscode';
import { TreeState } from '../tree/TreeState';
import { S3Explorer } from './S3Explorer';
import { Session } from '../common/Session';

export class S3BucketNode extends NodeBase {

    constructor(BucketName: string, parent?: NodeBase) 
    {
        super(BucketName, parent);

        this.BucketName = BucketName;
        this.Icon = "s3-bucket";
        // if(Key) {this.label = Key}

        // this.Icon = Key ? Key.endsWith("/") ? "folder" : "file" : "s3-bucket";
        // this.Key = Key ?? "";

        this.EnableNodeAlias = true;
        this.IsAwsResourceNode = true;
        this.SetContextValue();

        // Event subscriptions
        this.OnNodeRemove.subscribe(() => this.handleNodeRemove());
        this.OnNodeView.subscribe(() => this.handleNodeView());
    }

    @Serialize()
    public BucketName: string = "";

    @Serialize()
    public Key: string = "";

    public async NodeAdd(): Promise<void> {

    }

    private handleNodeRemove(): void {
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

    private handleNodeView(): void {
        S3Explorer.Render(Session.Current.ExtensionUri, this);
    }

}

// Register with NodeRegistry for deserialization
NodeRegistry.register('S3BucketNode', S3BucketNode);