/* global describe, it */

const assert = require('assert')
const rdf = require('rdf-ext')
const sinkTest = require('rdf-sink/test')
const N3Serializer = require('..')

function streamToString (stream) {
  const content = []

  stream.on('data', chunk => {
    content.push(chunk)
  })

  return rdf.waitFor(stream).then(() => {
    return content.join('')
  })
}

describe('rdf-serializer-n3', () => {
  sinkTest(N3Serializer, {readable: true})

  it('should serialize incoming quads', () => {
    const quad = rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object'))

    const input = rdf.dataset([quad]).toStream()

    const expected = '<http://example.org/subject> <http://example.org/predicate> "object".\n'

    const serializer = new N3Serializer()
    const stream = serializer.import(input)

    return streamToString(stream).then(actual => {
      assert.equal(actual, expected)
    })
  })

  it('should handle prefixes', () => {
    const quad = rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object'))

    const input = rdf.dataset([quad]).toStream()

    const expected = '' +
      '@prefix ex: <http://example.org/>.\n' +
      '\n' +
      'ex:subject ex:predicate "object".\n'

    const serializer = new N3Serializer()
    const stream = serializer.import(input)

    input.emit('prefix', 'ex', 'http://example.org/')

    return streamToString(stream).then(actual => {
      assert.equal(actual, expected)
    })
  })

  it('should handle Literals with language', () => {
    const quad = rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object', 'en'))

    const input = rdf.dataset([quad]).toStream()

    const expected = '<http://example.org/subject> <http://example.org/predicate> "object"@en.\n'

    const serializer = new N3Serializer()
    const stream = serializer.import(input)

    return streamToString(stream).then(actual => {
      assert.equal(actual, expected)
    })
  })

  it('should handle Literals with Datatype', () => {
    const quad = rdf.quad(
      rdf.namedNode('http://example.org/subject'),
      rdf.namedNode('http://example.org/predicate'),
      rdf.literal('object', rdf.namedNode('http://example.org/datatype')))

    const input = rdf.dataset([quad]).toStream()

    const expected = '<http://example.org/subject> <http://example.org/predicate> "object"^^<http://example.org/datatype>.\n'

    const serializer = new N3Serializer()
    const stream = serializer.import(input)

    return streamToString(stream).then(actual => {
      assert.equal(actual, expected)
    })
  })

  it('should combine triples for the same subject', () => {
    const blankNode = rdf.blankNode()

    const quads = [
      rdf.quad(
        rdf.namedNode('http://example.org/subject'),
        rdf.namedNode('http://example.org/predicateA'),
        rdf.literal('a')),
      rdf.quad(
        rdf.namedNode('http://example.org/subject'),
        rdf.namedNode('http://example.org/predicateB'),
        rdf.literal('b')),
      rdf.quad(
        blankNode,
        rdf.namedNode('http://example.org/predicateA'),
        rdf.literal('a')),
      rdf.quad(
        blankNode,
        rdf.namedNode('http://example.org/predicateB'),
        rdf.literal('b'))
    ]

    const input = rdf.dataset(quads).toStream()

    const expected = '' +
      '<http://example.org/subject> <http://example.org/predicateA> "a";\n' +
      '    <http://example.org/predicateB> "b".\n' +
      '_:b1 <http://example.org/predicateA> "a";\n' +
      '    <http://example.org/predicateB> "b".\n'

    const serializer = new N3Serializer()
    const stream = serializer.import(input)

    return streamToString(stream).then(actual => {
      assert.equal(actual, expected)
    })
  })

  it('should combine triples for the same subject and predicate', () => {
    const quads = [
      rdf.quad(
        rdf.namedNode('http://example.org/subject'),
        rdf.namedNode('http://example.org/predicate'),
        rdf.literal('a')),
      rdf.quad(
        rdf.namedNode('http://example.org/subject'),
        rdf.namedNode('http://example.org/predicate'),
        rdf.literal('b'))
    ]

    const input = rdf.dataset(quads).toStream()

    const expected = '<http://example.org/subject> <http://example.org/predicate> "a", "b".\n'

    const serializer = new N3Serializer()
    const stream = serializer.import(input)

    return streamToString(stream).then(actual => {
      assert.equal(actual, expected)
    })
  })
})
