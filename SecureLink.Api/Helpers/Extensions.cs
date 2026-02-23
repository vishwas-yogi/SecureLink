using System.Security.Claims;

internal static class Extensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (Guid.TryParse(userIdClaim, out Guid result))
        {
            return result;
        }
        else
        {
            throw new UnauthorizedAccessException("User Id not found");
        }
    }
}