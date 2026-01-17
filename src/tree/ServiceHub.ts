import { FileSystemService } from "../services/filesystem/FileSystemService";

export class ServiceHub {
    public static Current: ServiceHub;
    public FileSystemService: FileSystemService = new FileSystemService();

    public constructor() {
        ServiceHub.Current = this;
    }
}