# D2 Diagram Quick Start

D2 (Declarative Diagramming) is a modern diagram scripting language that turns text into beautiful diagrams. In Markup, simply create a code block with the `d2` language tag.

## Basic Syntax

Create a D2 diagram with a fenced code block:

```d2
x -> y: Connection label
```


This creates two boxes (x and y) connected by an arrow with a label.

## Shapes and Connections

### Simple Shapes

```d2
server: Web Server
database: PostgreSQL
cache: Redis
```

### Connections

```d2
user -> server: HTTP Request
server -> database: SQL Query
server -> cache: Get/Set
```

### Both Together

```d2
client: Mobile App
api: API Server
db: Database

client -> api: REST API
api -> db: Query
```

## Styling

### Shape Styles

```d2
users: Users {
  shape: person
  style.fill: "#d4e8ff"
}

server: Server {
  shape: rectangle
  style.fill: "#ffe8d4"
}

data: Data {
  shape: cylinder
  style.fill: "#d4ffe8"
}
```

### Multiple Items

```d2
users: Users {
  style.multiple: true
}
```

## Layout Direction

Control diagram flow:

```d2
direction: right

frontend -> backend -> database
```

Options: `right`, `left`, `up`, `down`

## Containers

Group related items:

```d2
network: Cloud Network {
  web: Web Tier
  app: App Tier
  data: Data Tier

  web -> app
  app -> data
}
```

## Complete Example

```d2
direction: right

users: Users {
  shape: person
  style.multiple: true
}

users -> web: HTTPS

web: Web Server {
  style.fill: "#d4e8ff"
}

web -> api: REST
web -> cdn: Static Assets

api: API Gateway {
  style.fill: "#ffe8d4"
}

api -> db: Queries
api -> cache: Get/Set

db: Database {
  shape: cylinder
  style.fill: "#d4ffe8"
}

cache: Redis {
  shape: cylinder
  style.fill: "#ffd4e8"
}

cdn: CDN {
  shape: cloud
}
```

## Tips

- **Keep it simple** - Start with basic shapes and connections
- **Use containers** - Group related components
- **Add style** - Use fills and shapes to make diagrams clearer
- **Label connections** - Describe what flows between components
- **Set direction** - Choose the flow that makes most sense

For more details, visit the [D2 documentation](https://d2lang.com/tour/intro).
