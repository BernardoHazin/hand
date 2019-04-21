import GraphQLJSON from 'graphql-type-json'
import db from '../db/generator'
import path from 'path'
import fs from 'fs'
import pubsub from './pubsub'

function fileContent(project) {
  let content = `module.exports = {\n`
  project
    .get('models')
    .value()
    .forEach(el => {
      content += `\t${el.name}: {\n`
      content += `\t\tvalidation: {\n`
      el.codes
        .filter(cd => cd.codeType === 'Validation')
        .forEach(cd => {
          content += `\t\t\t${cd.index}: {\n`
          content += `\t\t\t\tcode: '${el.abbreviation}${cd.name}-${
            cd.index
          }', /** @description ${cd.description} **/\n`
          content += `\t\t\t\tstatus: ${cd.status},\n`
          content += '\t\t\t\tmessage: {\n'
          cd.message.forEach(msg => {
            content += `\t\t\t\t\t'${msg.lang}': '${msg.content}',\n`
          })
          content += '\t\t\t\t}\n'
          content += `\t\t\t},\n`
        })
      content += `\t\t},\n`
      content += `\t\truntime: {\n`
      el.codes
        .filter(cd => cd.codeType === 'Run time')
        .forEach(cd => {
          content += `\t\t\t${cd.index}: {\n`
          content += `\t\t\t\tcode: '${el.abbreviation}${cd.name}-${
            cd.index
          }', /** @description ${cd.description} **/\n`
          content += `\t\t\t\tstatus: ${cd.status},\n`
          content += '\t\t\t\tmessage: {\n'
          cd.message.forEach(msg => {
            content += `\t\t\t\t\t'${msg.lang}': '${msg.content}',\n`
          })
          content += '\t\t\t\t}\n'
          content += `\t\t\t},\n`
        })
      content += `\t\t}\n`
      content += `\t},\n`
    })
  content += `}`
  return content
}

export default {
  JSON: GraphQLJSON,
  Query: {
    getProject: async (parent, { name }) => {
      if (!name) return new Error('Invalid arguments')
      const project = db
        .get('projects')
        .find({ name })
        .value()
      return project || new Error('Project not found')
    },
    path: async (parent, args) => {
      return __dirname
    },
    projects: async (parent, args) => {
      return db.get('projects').value()
    },
    relativePath: async (parent, args) => {
      return fs
        .readdirSync(path.resolve(args.path), {
          withFileTypes: true
        })
        .filter(el => el.isDirectory())
        .filter(el => el.name[0] !== '.')
        .map(el => el.name)
    },
    homePath: async (parent, args) => {
      return fs.readdirSync(path.resolve('/home'))
    }
  },
  Mutation: {
    createProject: async (parent, { name, outputDir }) => {
      if (!name || !outputDir) return new Error('Invalid arguments')
      else {
        const projects = db.get('projects')
        if (projects.value().some(el => el.name === name))
          return new Error('Project name already in use')
        projects
          .push({
            name,
            outputDir: path.normalize(outputDir),
            models: []
          })
          .write()
        pubsub.publish('newProject', {
          newProject: projects.value()
        })
        return 'Project created!'
      }
    },
    deleteProject: async (parent, { name }) => {
      if (!name) return new Error('Invalid arguments')
      const projects = db.get('projects')
      const project = projects.value().find(el => el.name === name)
      if (!project) return new Error('Project not found')
      projects.remove({ name }).write()
      pubsub.publish('newProject', {
        newProject: projects.value()
      })
      fs.unlink(`${project.outputDir}/${project.name}.json`, err => {
        if (err) return err
      })
      return 'Project removed!'
    },
    createModel: async (parent, { projectName, name, abbreviation }) => {
      if (!name || !abbreviation) return new Error('Invalid arguments')
      const project = db.get('projects').find({ name: projectName })
      if (!project.value()) return new Error('Project not found')
      if (
        project
          .get('models')
          .find({ name })
          .value()
      )
        return new Error('Name already in use')
      if (
        project
          .get('models')
          .find({ abbreviation })
          .value()
      )
        return new Error('Abbreviation already in use')
      project
        .get('models')
        .push({
          name,
          abbreviation,
          codes: []
        })
        .write()
      pubsub.publish('modelAdded', {
        modelAdded: project.value()
      })
      return 'Model created'
    },
    deleteModel: async (parent, { projectName, name }) => {
      if (!name || !projectName) return new Error('Invalid arguments')
      const project = db.get('projects').find({ name: projectName })
      if (!project.value()) return new Error('Project not found')
      if (
        !project
          .get('models')
          .find({ name })
          .value()
      )
        return new Error('Model does not exist')
      project
        .get('models')
        .remove({ name })
        .write()
      pubsub.publish('modelAdded', {
        modelAdded: project.value()
      })
      return 'Model removed'
    },
    setCodes: async (parent, { projectName, modelName, codes }) => {
      if (!projectName || !modelName || !codes)
        return new Error('Invalid arguments')
      const project = db.get('projects').find({ name: projectName })
      if (!project.value()) return new Error('Project not found')
      const model = project.get('models').find({ name: modelName })
      if (!model.value()) return new Error('Model does not exist')
      model.set('codes', codes.map(el => JSON.parse(el))).write()
      return 'Codes seted'
    },
    generate: async (parent, { projectName }) => {
      if (!projectName) return new Error('Invalid arguments')
      const project = db.get('projects').find({ name: projectName })
      if (!project.value()) return new Error('Project not found')
      const { outputDir, name } = project.value()
      return new Promise((resolve, reject) => {
        fs.writeFile(`${outputDir}/${name}.js`, fileContent(project), err => {
          if (err) reject(err)
          resolve('File saved')
        })
      })
        .then(() => {
          return 'Project generated!'
        })
        .catch(err => err)
    }
  },
  Subscription: {
    newProject: {
      subscribe: () => pubsub.asyncIterator('newProject')
    },
    modelAdded: {
      subscribe: () => pubsub.asyncIterator('modelAdded')
    }
  }
}
