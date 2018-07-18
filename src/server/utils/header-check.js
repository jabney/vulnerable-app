'use strict'
var express = require('express')
var url = require('url')

/**
 * Middleware. Check that the request header origin or referer
 * match a value in the given whitelist.
 *
 * @param {string[]} whitelist
 * @return {(req: express.Request, res: express.Response, next:(error?:any) => void) => void}
 */
module.exports = function (whitelist) {
  return function (req, res, next) {
    var method = req.method

    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next()
    }

    // @ts-ignore
    var origin = getBaseUrl(req.headers.origin)
    // @ts-ignore
    var referer = getBaseUrl(req.headers.referer)
    var errorMessage

    if (!origin && !referer) {
      // Allow if neither origin nor referer header is present.
      return next()
    }

    if (origin && whitelist.indexOf(origin) < 0) {
      errorMessage = 'Invalid origin header ' + origin
    } else if (referer && whitelist.indexOf(referer) < 0) {
      errorMessage = 'Invalid referer header ' + referer
    } else {
      // This is probably redundant.
      console.log('Origin and referer headers were not present')
      errorMessage = null
    }

    if (errorMessage) {
      res.statusCode = 403
      return next(new Error(errorMessage))
    } else {
      return next()
    }
  }
}

/**
 * Get the base portion of a url, e.g.,
 * 'http://example.com/path' -> 'http://example.com'.
 *
 * @param {string} sourceUrl
 * @return {string}
 */
function getBaseUrl(sourceUrl) {
  var parsedUrl = url.parse(sourceUrl)
  return parsedUrl.protocol + '//' + parsedUrl.host
}
