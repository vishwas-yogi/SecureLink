using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;
using SecureLink.Infrastructure.Contracts;

namespace SecureLink.Api.Helpers;

public class InternalApiKeyFilter(IOptions<InternalApiOptions> options) : IAsyncAuthorizationFilter
{
    private readonly InternalApiOptions _options = options.Value;
    private const string HeaderName = "X-Internal-Key";

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        if (!context.HttpContext.Request.Headers.TryGetValue(HeaderName, out var key))
        {
            context.Result = new UnauthorizedObjectResult(
                new { message = $"{HeaderName} header missing!" }
            );
            return Task.CompletedTask;
        }

        if (key != _options.ApiKey)
        {
            context.Result = new UnauthorizedObjectResult(
                new { message = "Invalid internal API key" }
            );
            return Task.CompletedTask;
        }

        return Task.CompletedTask;
    }
}

public class InternalApiKeyAttribute : TypeFilterAttribute
{
    public InternalApiKeyAttribute()
        : base(typeof(InternalApiKeyFilter)) { }
}
