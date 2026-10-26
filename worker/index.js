// rost.build is the one address. www.rost.build sends you there for good
// (301), keeping the path, so old links and typed URLs still land. Every
// other request is the static site.
export default {
  fetch(request, env) {
    const url = new URL(request.url)
    if (url.hostname === 'www.rost.build') {
      url.hostname = 'rost.build'
      return Response.redirect(url.toString(), 301)
    }
    return env.ASSETS.fetch(request)
  },
}
