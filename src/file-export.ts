import { Capacitor } from "@capacitor/core";
export async function exportData(
  data: string,
  name: string,
  title = "Guild character backup",
) {
  if (Capacitor.isNativePlatform()) {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const { Share } = await import("@capacitor/share");
    const { Encoding } = await import("@capacitor/filesystem");
    const file = await Filesystem.writeFile({
      path: name,
      data,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({
      title,
      url: file.uri,
      dialogTitle: `Save ${title.toLowerCase()}`,
    });
  } else {
    const url = URL.createObjectURL(
        new Blob([data], {
          type: name.endsWith(".json")
            ? "application/json"
            : "text/plain;charset=utf-8",
        }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
