import GraphQLJSON from 'graphql-type-json'
import db from '../db/generator'
import path from 'path'
import fs from 'fs'
import pubsub from './pubsub'

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
        /* return new Promise((resolve, reject) => {
          fs.writeFile(`${outputDir}/${name}.json`, '{}', err => {
            if (err) reject(err)
            resolve('File saved')
          })
        })
          .then(() => {})
          .catch(err => err) */
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
      console.log(JSON.parse(codes[0]))
      /* if (!projectName || !modelName || !codes)
        return new Error('Invalid arguments')
      const project = db.get('projects').find({ name: projectName })
      if (!project.value()) return new Error('Project not found')
      const model = project.get('models').find({ name: modelName })
      if (!model.value()) return new Error('Model does not exist')
      model.set('codes', codes).write() */
      return 'Codes seted'
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
