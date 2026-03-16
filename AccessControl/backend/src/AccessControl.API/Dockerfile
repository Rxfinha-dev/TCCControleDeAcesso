FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["src/AccessControl.API/AccessControl.API.csproj", "src/AccessControl.API/"]
RUN dotnet restore "src/AccessControl.API/AccessControl.API.csproj"
COPY . .
WORKDIR "/src/src/AccessControl.API"
RUN dotnet build "AccessControl.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AccessControl.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "AccessControl.API.dll"]
