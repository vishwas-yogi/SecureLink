FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 5009

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["SecureLink.Api/SecureLink.Api.csproj", "SecureLink.Api/"]
COPY ["SecureLink.Core/SecureLink.Core.csproj", "SecureLink.Core/"]
COPY ["SecureLink.Infrastructure/SecureLink.Infrastructure.csproj", "SecureLink.Infrastructure/"]
RUN dotnet restore "SecureLink.Api/SecureLink.Api.csproj"

# Copy the rest of the source code
COPY . .

# Build and publish the release
WORKDIR "/src/SecureLink.Api"
RUN dotnet publish "SecureLink.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage: copy the published files to the runtime image
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

# TODO: Add a non priveledged user
ENTRYPOINT ["dotnet", "SecureLink.Api.dll"]