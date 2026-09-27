// Csak akkor fut, ha a service worker nem fogta el a megosztást.
// A kérés törzsét szándékosan nem olvassuk: a megosztott tartalom itt nem kerül feldolgozásra.

export function POST(request: Request) {
  return Response.redirect(new URL("/?shared=failed", request.url), 303);
}

export function GET(request: Request) {
  return Response.redirect(new URL("/", request.url), 303);
}
