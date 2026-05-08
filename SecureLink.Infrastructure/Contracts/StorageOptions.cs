namespace SecureLink.Infrastructure.Contracts;

public class StorageOptions
{
    public string? UploadDirectory { get; set; }
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string Bucket { get; set; } = string.Empty;
}
