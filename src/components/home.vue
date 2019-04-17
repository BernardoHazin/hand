<template>
  <v-container>
    <v-toolbar dense class="secondary" dark>
      <v-toolbar-title>
        <v-icon>fas fa-hands-helping</v-icon>HAND
      </v-toolbar-title>
    </v-toolbar>
    <v-dialog max-width="30vw" v-model="dialog">
      <v-card>
        <v-card-title>Project name</v-card-title>
        <v-card-text>
          <p>Choose a project name</p>
          <p>Output directory: {{outputDir}}</p>
          <v-text-field placeholder="Project name" v-model="projectName"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="resetDialog">Cancel</v-btn>
          <v-btn
            @click="createProject"
            :disabled="loading || !projectName || !outputDir"
            :loading="loading"
            color="success"
          >Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog max-width="30vw" v-model="dialog2">
      <v-card>
        <v-card-title>Are you sure you want to delete {{projectName}}?</v-card-title>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="resetDialog2">Cancel</v-btn>
          <v-btn
            @click="deleteProject"
            :disabled="loading || !projectName"
            :loading="loading"
            color="error"
          >Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-layout class="mt-2" column v-if="selected">
      <v-layout row align-center>
        <v-btn icon @click="selected = ''">
          <v-icon>fas fa-arrow-left</v-icon>
        </v-btn>
        <h2>{{selected.name.toUpperCase()}}</h2>
        <v-btn small round>generate</v-btn>
      </v-layout>
      <v-layout>
        <v-flex xs6 class="pa-1">
          <h2>Create model</h2>
          <v-form class="mt-2 pa-2" @submit.prevent="createModel">
            <v-text-field v-model="modelName" color="secondary" label="Name" box></v-text-field>
            <v-text-field
              v-model="modelAbbreviation"
              v-mask="'AAA'"
              color="secondary"
              counter="3"
              label="Abbreviation"
              box
            ></v-text-field>
            <v-btn
              round
              color="success"
              :loading="loading"
              :disabled="loading || !modelName || !modelAbbreviation"
              type="submit"
            >create</v-btn>
          </v-form>
        </v-flex>
        <v-flex xs6>
          <h2>Created models</h2>
          <v-list class="primary mt-2 pa-2">
            <v-list-tile
              class="secondary white--text elevation-2"
              v-for="(model, index) in selected.models"
              :key="index"
            >
              {{model.name}}
              <v-spacer></v-spacer>
              {{model.abbreviation}}
            </v-list-tile>
          </v-list>
        </v-flex>
      </v-layout>
    </v-layout>
    <v-layout v-else class="mt-2" row align-start>
      <v-flex xs6 class="pa-1">
        <h2>Create project</h2>
        <h3 class="mt-2">Choose output dir</h3>
        <v-list class="primary mt-2 pa-2">
          <v-list-tile
            class="secondary white--text elevation-2"
            @click="navigate('../')"
            v-if="relative.length > 1"
            style="cursor: pointer;"
          >
            <div class="ml-2">..</div>
            <v-spacer/>
            <div v-if="$apollo.queries.relativePath.loading">Loading...</div>
          </v-list-tile>
          <v-list-tile
            @click.self="navigate(path)"
            style="cursor: pointer;"
            class="secondary white--text elevation-2"
            dark
            v-for="(path, index) in paths"
            :key="index"
          >
            {{path.toUpperCase()}}
            <v-spacer/>
            <v-btn round @click="openCreateDialog(path)" class="success" small>Create</v-btn>
          </v-list-tile>
        </v-list>
      </v-flex>
      <v-flex xs6 class="pa-1">
        <h2>Existing projects</h2>
        <h3 class="mt-2">Choose a project</h3>
        <v-list class="primary mt-2 pa-2">
          <v-list-tile
            class="secondary white--text elevation-2"
            style="cursor: pointer;"
            dark
            @click.self="getProject(name)"
            v-for="({ name }, index) in existingPaths"
            :key="index"
          >
            {{name}}
            <v-spacer/>
            <v-btn round @click="openDeleteDialog(name)" class="error" small>delete</v-btn>
          </v-list-tile>
        </v-list>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import gql from 'graphql-tag'
import { mask } from 'vue-the-mask'

export default {
  name: 'home',
  data() {
    return {
      dialog: false,
      dialog2: false,
      loading: false,
      relative: ['/home'],
      outputDir: '',
      projectName: '',
      paths: [],
      existingPaths: [],
      selected: '',
      modelName: '',
      modelAbbreviation: ''
    }
  },
  directives: {
    mask
  },
  apollo: {
    projects: {
      query: gql`
        query projects {
          projects {
            name
          }
        }
      `,
      result({ data }) {
        this.existingPaths = data.projects
      },
      subscribeToMore: {
        document: gql`
          subscription {
            newProject {
              name
            }
          }
        `,
        updateQuery(previousResult, { subscriptionData }) {
          console.log('>', subscriptionData)
          this.existingPaths = subscriptionData.data.newProject
        }
      }
    },
    relativePath: {
      query: gql`
        query relativePath($path: String!) {
          relativePath(path: $path)
        }
      `,
      variables() {
        return {
          path: this.relative.join('/')
        }
      },
      result({ data }) {
        console.log(data)
        this.paths = data.relativePath
      }
    }
  },
  methods: {
    createProject() {
      this.loading = true
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($name: String!, $outputDir: String!) {
              createProject(name: $name, outputDir: $outputDir)
            }
          `,
          variables: {
            name: this.projectName,
            outputDir: this.outputDir
          }
        })
        .then(res => {
          console.log('response', res)
          this.$notify({
            group: 'main',
            type: 'success',
            title: 'Success',
            text: 'Project created'
          })
          this.resetDialog()
        })
        .catch(err => {
          this.$notify({
            group: 'main',
            type: 'danger',
            title: 'Error',
            text: err.message
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    deleteProject() {
      this.loading = true
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($name: String!) {
              deleteProject(name: $name)
            }
          `,
          variables: {
            name: this.projectName
          }
        })
        .then(res => {
          console.log('response', res)
          this.$notify({
            group: 'main',
            type: 'success',
            title: 'Success',
            text: 'Project deleted'
          })
          this.resetDialog2()
        })
        .catch(err => {
          this.$notify({
            group: 'main',
            type: 'danger',
            title: 'Error',
            text: err.message
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    createModel() {
      this.loading = true
      this.$apollo
        .mutate({
          mutation: gql`
            mutation(
              $projectName: String!
              $name: String!
              $abbreviation: String!
            ) {
              createModel(
                projectName: $projectName
                name: $name
                abbreviation: $abbreviation
              )
            }
          `,
          variables: {
            projectName: this.selected.name,
            name: this.modelName,
            abbreviation: this.modelAbbreviation
          }
        })
        .then(res => {
          this.$notify({
            group: 'main',
            type: 'success',
            title: 'Success',
            text: 'Model created'
          })
        })
        .catch(err => {
          this.$notify({
            group: 'main',
            type: 'error',
            title: 'Error',
            text: err.message
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    getProject(name) {
      this.$apollo
        .query({
          query: gql`
            query getProject($name: String!) {
              getProject(name: $name) {
                name
                models {
                  name
                  abbreviation
                }
              }
            }
          `,
          variables: {
            name: name
          }
        })
        .then(({ data }) => {
          console.log('getProjects', data)
          this.selected = data.getProject
        })
        .catch(err => {
          this.$notify({
            group: 'main',
            type: 'danger',
            title: 'Error',
            text: err.message
          })
        })
    },
    openDeleteDialog(name) {
      this.projectName = name
      this.dialog2 = true
    },
    resetDialog() {
      this.outputDir = ''
      this.dialog = false
      this.projectName = ''
    },
    resetDialog2() {
      this.dialog2 = false
      this.projectName = ''
    },
    openCreateDialog(dir) {
      this.outputDir = this.relative.join('/') + `/${dir}`
      this.dialog = true
    },
    navigate(dir) {
      if (dir === '../') this.relative.pop()
      else this.relative.push(dir)
      this.$apollo.queries.relativePath.start()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
