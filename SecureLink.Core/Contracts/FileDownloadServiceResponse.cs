namespace SecureLink.Core.Contracts;

public record FileDownloadServiceResponse
{
    public required FileResponse FileDetails { get; init; }

    /// <summary>
    ///  Take care of disposing it.
    /// If is not being disposed automatically.
    /// Using File() in the controller automatically handles the dispositon
    /// </summary>
    public required Stream FileStream { get; init; }
}
