# Aquamarine-Utils

Expects these json files (2 depending on the useDevMode variable in database_con.js)
If useDevMode is true, it attempts to read "database_config.dev.json", else it attempts to read "database_config.json"

### JSON Structures
discord_config.json
```json
{
    "webhook_url" : "https://discord.com/api/examplewebhookid/examplewebhook"
}
```
(Note, the config above isn't required, but the file does have to exist and be valid JSON)

database_config.json/database_config.dev.json:
```json
{
    "database_host" : "127.0.0.1",
    "database_user" : "user",
    "database_password" : "password",
    "database" : "database"
}
```

endpoints.json:
```json
{
    "discovery_url" : "disc.olv.example.com",
    "host_url" : "api.olv.example.com",
    "portal_url" : "portal.olv.example.com",
    "n3ds_url" : "n3ds.olv.example.com",
    "api_url" : "api.olv.example.com",
    "web_url" : "web.example.com",
    "admin_url" : "admin.olv.example.com"
}
```
Subdomains aren't set in stone, but you get the general understanding of it.
