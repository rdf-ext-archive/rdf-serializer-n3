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

      this.writer.write(quad)
    })

    input.on('end', () => {
      this.writer.end()
    })

    input.on('error', err => {
      this.emit('error', err)
    })
  }
}

module.exports = StreamWriter
