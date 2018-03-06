const util = require('n3').Util
const Readable = require('readable-stream')
const StreamWriter = require('n3').StreamWriter

class SerializerStream extends Readable {
  constructor (input) {
    super({
      read: () => {}
    })

    this.prefixes = {}

    input.on('prefix', (prefix, namespace) => {
      this.prefixes[prefix] = namespace
    })

    input.on('data', quad => {
      if (!this.writer) {
        this.writer = new StreamWriter({
          format: 'text/turtle',
          prefixes: this.prefixes
        })

        this.writer.on('data', chunk => {
          this.push(chunk)
        })

        this.writer.on('end', () => {
          this.push(null)
        })
      }

      this.writer.write({
        subject: SerializerStream.toN3(quad.subject),
        predicate: SerializerStream.toN3(quad.predicate),
        object: SerializerStream.toN3(quad.object)
      })
    })

    input.on('end', () => {
      this.writer.end()
    })

    input.on('error', err => {
      this.emit('error', err)
    })
  }

  static toN3 (term) {
    if (term.termType === 'NamedNode') {
      return term.value
    } else if (term.termType === 'BlankNode') {
      return '_:' + term.value
    } else if (term.termType === 'Literal') {
      if (term.language) {
        return util.createLiteral(term.value, term.language)
      } else if (term.datatype.value === 'http://www.w3.org/2001/XMLSchema#string') {
        return '"' + term.value + '"'
      } else {
        return util.createLiteral(term.value, term.datatype.value)
      }
    }
  }
}

module.exports = SerializerStream
