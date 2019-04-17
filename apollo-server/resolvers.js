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
        .readdirSync(path.resolve('/home', args.path), { withFileTypes: true })
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
        return new Promise((resolve, reject) => {
          fs.writeFile(`${outputDir}/${name}.json`, '{}', err => {
            if (err) reject(err)
            resolve('File saved')
          })
        })
          .then(() => {
            projects
              .push({
                name,
                outputDir,
                models: []
              })
              .write()
            pubsub.publish('newProject', {
              newProject: projects.value()
            })
            return 'Project created!'
          })
          .catch(err => err)
      }
    },
    deleteProject: async (parent, { name }) => {
      if (!name) return new Error('Invalid arguments')
      const projects = db.get('projects')
      const project = projects.value().find(el => el.name === name)
      if (!project) return new Error('Project not found')
      return new Promise((resolve, reject) => {
        fs.unlink(`${project.outputDir}/${project.name}.json`, err => {
          if (err) reject(err)
          resolve('Project removed!')
        })
      })
        .then(() => {
          projects.remove({ name }).write()
          pubsub.publish('newProject', {
            newProject: projects.value()
          })
        })
        .catch(err => err)
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
