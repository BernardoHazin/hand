import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'

const adapter = new FileSync(path.join(__dirname, 'db.json'))
const db = low(adapter)
db.defaults({ projects: [] }).write()

export default db
