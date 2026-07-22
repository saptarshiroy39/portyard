export function getBrandColor(brand: string | undefined): string {
  switch (brand) {
    case "vite":
    case "react":
    case "node":
    case "angular":
    case "vue":
      return "charts.yellow";
    case "docker":
    case "http":
    case "https":
      return "charts.blue";
    case "django":
    case "flask":
    case "python":
    case "fastapi":
    case "uvicorn":
    case "ruby":
    case "sinatra":
    case "php":
    case "go":
    case "java":
      return "charts.green";
    case "postgres":
    case "mongodb":
    case "mysql":
    case "redis":
      return "charts.purple";
    default:
      return "charts.foreground";
  }
}

export function getBrandIcon(
  brand: string | undefined,
  isShared: boolean,
): string {
  if (isShared) {
    return "broadcast";
  }
  switch (brand) {
    case "postgres":
    case "mongodb":
    case "mysql":
    case "redis":
      return "database";
    case "vite":
    case "react":
    case "angular":
    case "vue":
    case "http":
    case "https":
      return "globe";
    case "docker":
      return "package";
    case "node":
    case "python":
    case "django":
    case "flask":
    case "fastapi":
    case "uvicorn":
    case "ruby":
    case "sinatra":
    case "php":
    case "go":
    case "java":
      return "server";
    default:
      return "plug";
  }
}
