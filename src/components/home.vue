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
    <v-dialog max-width="30vw" v-model="dialog3">
      <v-card>
        <v-card-title>Are you sure you want to delete {{modelName}} model?</v-card-title>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="resetDialog3">Cancel</v-btn>
          <v-btn
            @click="deleteModel"
            :disabled="loading || !modelName"
            :loading="loading"
            color="error"
          >Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-layout class="mt-2" column v-if="selected">
      <v-layout row align-center>
        <v-btn icon @click="selected = '', selectedModel = ''">
          <v-icon>fas fa-arrow-left</v-icon>
        </v-btn>
        <h2>{{selected.name.toUpperCase()}}</h2>
        <v-icon v-if="selectedModel" class="ml-2">fas fa-arrow-circle-right</v-icon>
        <h2 v-if="selectedModel" class="ml-2">{{selectedModel.toUpperCase()}}</h2>
        <v-spacer/>
        <v-btn round v-if="selectedModel" @click="selectedModel = ''">Models</v-btn>
        <v-btn color="info" round>generate</v-btn>
      </v-layout>
      <v-layout v-if="selectedModel">
        <v-flex xs6 class="pa-1">
          <h2>Create code</h2>
          <v-form ref="addCode" class="mt-2 pa-2" @submit.prevent="addCode">
            <v-text-field
              v-model="codeName"
              mask="AAAA"
              counter="4"
              color="secondary"
              label="Name"
              box
            ></v-text-field>
            <v-text-field color="secondary" v-model="codeDescription" label="Description" box></v-text-field>
            <v-select
              box
              :items="['Validation', 'Run time']"
              color="secondary"
              label="Type"
              v-model="codeType"
            ></v-select>
            <v-btn
              round
              color="success"
              :loading="loading"
              :disabled="loading || !codeName || !codeDescription || !codeType"
              type="submit"
            >create</v-btn>
          </v-form>
        </v-flex>
        <v-flex xs6 class="pa-1">
          <v-layout column>
            <h2>Created codes</h2>
            <v-list two-line class="primary mt-2 white--text">
              <draggable v-model="codes" :ghostClass="'ghost--class'">
                <v-layout
                  style="cursor: pointer;"
                  class="secondary pa-2"
                  column
                  v-for="(code, index) in codes"
                  :key="index"
                >
                  <v-layout row>
                    [{{code.codeType}}] {{code.name}}
                    <v-spacer/>
                    {{100 + index}}
                  </v-layout>
                  <div style="white-space: normal;">{{code.description}}</div>
                </v-layout>
              </draggable>
            </v-list>
            <!-- <table class="secondary mt-3 pa-2 white--text">
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Index</th>
              </tr>
              <draggable v-model="codes">
                <tr v-for="(code, index) in codes" :key="index">
                  <td>[{{code.codeType === 'Validation' ? 'VAL' : 'RTN'}}] {{code.name}}</td>
                  <td>{{code.description}}</td>
                  <td>{{code.index}}</td>
                </tr>
              </draggable>
            </table>-->
          </v-layout>
          <!-- <v-list class="primary mt-2 pa-2">
            <v-list-tile
              class="secondary white--text elevation-2"
              v-for="(code, index) in codes"
              :key="index"
            >
              <v-layout column>
                <v-list-tile-title>[{{code.codeType === 'Validation' ? 'VAL' : 'RTN'}}] {{code.name}}</v-list-tile-title>
                <v-list-tile-sub-title class="white--text">{{code.index}}</v-list-tile-sub-title>
                {{code.description}}
              </v-layout>
            </v-list-tile>
          </v-list>-->
        </v-flex>
      </v-layout>
      <v-layout v-else>
        <v-flex xs6 class="pa-1">
          <h2>Create model</h2>
          <v-form ref="addModel" class="mt-2 pa-2" @submit.prevent="createModel">
            <v-text-field v-model="modelName" color="secondary" label="Name" box></v-text-field>
            <v-text-field
              v-model="modelAbbreviation"
              mask="AAA"
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
              style="cursor: pointer;"
              @click.self="setModel(name, codes)"
              v-for="({ name, abbreviation, codes }, index) in selected.models"
              :key="index"
            >
              [{{abbreviation}}]
              {{name}}
              <v-spacer></v-spacer>
              <v-btn round small @click="openCreateModelDialog(name)" color="error">delete</v-btn>
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
import draggable from 'vuedraggable'

export default {
  name: 'home',
  data() {
    return {
      dialog: false,
      dialog2: false,
      dialog3: false,
      loading: false,
      relative: ['/home'],
      outputDir: '',
      projectName: '',
      paths: [],
      existingPaths: [],
      selected: '',
      modelName: '',
      modelAbbreviation: '',
      selectedModel: '',
      codes: [],
      codeName: '',
      codeDescription: '',
      codeType: ''
    }
  },
  components: {
    draggable
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
      fetchPolicy: 'no-cache',
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
    },
    $subscribe: {
      modelAdded: {
        query: gql`
          subscription modelAdded {
            modelAdded {
              name
              models {
                name
                abbreviation
              }
            }
          }
        `,
        result({ data }) {
          this.selected = data.modelAdded
        }
      }
    }
  },
  watch: {
    codes(val) {
      console.log(val.map(el => JSON.stringify(el)))
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
          this.$refs.addModel.reset()
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
          this.$refs.addModel.reset()
        })
    },
    deleteModel() {
      this.loading = true
      this.$apollo
        .mutate({
          mutation: gql`
            mutation($projectName: String!, $name: String!) {
              deleteModel(projectName: $projectName, name: $name)
            }
          `,
          variables: {
            projectName: this.selected.name,
            name: this.modelName
          }
        })
        .then(res => {
          console.log('response', res)
          this.$notify({
            group: 'main',
            type: 'success',
            title: 'Success',
            text: 'Model deleted'
          })
          this.resetDialog3()
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
    addCode() {
      const max = Math.max(this.codes.map(el => el.index))
      this.codes.push({
        name: this.codeName,
        description: this.codeDescription,
        codeType: this.codeType,
        index: max ? max + 1 : 100
      })
      this.$refs.addCode.reset()
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
                  codes {
                    description
                    name
                    codeType
                    index
                  }
                }
              }
            }
          `,
          fetchPolicy: 'no-cache',
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
    setModel(name, codes) {
      this.selectedModel = name
      this.codes = codes
    },
    openCreateDialog(dir) {
      this.outputDir = this.relative.join('/') + `/${dir}`
      this.dialog = true
    },
    openDeleteDialog(name) {
      this.projectName = name
      this.dialog2 = true
    },
    openCreateModelDialog(name) {
      this.modelName = name
      this.dialog3 = true
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
    resetDialog3() {
      this.dialog3 = false
      this.modelName = ''
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
table,
th,
td {
  border-collapse: collapse;
  padding: 15px;
}

td {
  max-width: 150px;
  overflow: hidden;
  cursor: pointer;
  text-overflow: ellipsis;
}

tr {
  text-align: left;
}
</style>
