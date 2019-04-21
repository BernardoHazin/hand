<template>
  <v-container>
    <v-toolbar dense class="secondary" dark>
      <v-toolbar-title>
        <v-icon>fas fa-hands-helping</v-icon>HAND
      </v-toolbar-title>
    </v-toolbar>
    <!-- DIALOGS -->
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
    <!-- LAYOUTS -->
    <!-- project selected -->
    <v-layout class="mt-2" column v-if="selected">
      <!-- navbar -->
      <v-layout row align-center>
        <v-btn icon @click="selected = '', resetModel()">
          <v-icon>fas fa-arrow-left</v-icon>
        </v-btn>
        <h2>{{selected.name.toUpperCase()}}</h2>
        <v-icon v-if="selectedModel" class="ml-2">fas fa-arrow-circle-right</v-icon>
        <h2 v-if="selectedModel" class="ml-2">{{selectedModel.toUpperCase()}}</h2>
        <v-spacer/>
        <v-btn round v-if="selectedModel" @click="resetModel">Models</v-btn>
        <v-btn color="info" :disabled="autoGenerate || loading" round @click="generate">generate</v-btn>
        <div>
          <v-switch v-model="autoGenerate" label="Auto generate"></v-switch>
        </div>
      </v-layout>
      <!-- model selected -->
      <v-layout v-if="selectedModel">
        <!-- left -->
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
            <v-text-field color="secondary" mask="###" v-model="codeStatus" label="Status" box></v-text-field>
            <v-select
              box
              :items="['Validation', 'Run time']"
              color="secondary"
              label="Type"
              v-model="codeType"
            ></v-select>
            <!-- create message -->
            <v-layout row align-start>
              <v-select
                color="secondary"
                label="Locale"
                class="mr-1"
                box
                :items="locales"
                v-model="locale"
                item-value="0"
                item-text="2"
              ></v-select>
              <v-text-field color="secondary" v-model="message" label="Message" box></v-text-field>
              <v-btn fab small depressed :disabled="!locale || !message" @click="pushMessage">
                <v-icon>fas fa-plus</v-icon>
              </v-btn>
            </v-layout>
            <!-- messages list -->
            <v-layout column>
              <v-list class="primary">
                <v-list-tile
                  class="secondary white--text"
                  v-for="({ content, lang }, i) in messagesList"
                  :key="i"
                >
                  <v-list-tile-title>
                    <p>[{{lang}}] {{content}}</p>
                  </v-list-tile-title>
                  <v-list-tile-action>
                    <button class="ml-2 delete-button" fab @click="removeMessage(i)">
                      <v-icon class="pa-1 red--text" dark>fas fa-xs fa-trash</v-icon>
                    </button>
                  </v-list-tile-action>
                </v-list-tile>
              </v-list>
            </v-layout>
            <v-btn
              round
              color="success"
              :loading="loading"
              :disabled="loading || !codeName || !codeDescription || !codeType || !codeStatus || !messagesList.length"
              type="submit"
            >create</v-btn>
          </v-form>
        </v-flex>
        <!-- right -->
        <v-flex xs6 class="pa-1">
          <v-layout column>
            <h2>Created codes</h2>
            <v-list
              two-line
              class="primary mt-2 white--text"
              style="max-height: 50vh; overflow: auto;"
            >
              <draggable v-model="codes">
                <v-layout
                  style="cursor: pointer;"
                  class="pa-2"
                  column
                  v-for="(code, index) in codes"
                  :class="code.codeType === 'Validation' ? 'accent' : 'secondary'"
                  :key="index"
                >
                  <v-layout row>
                    [{{code.codeType}}] {{code.name}}
                    <v-spacer/>
                    <button
                      :disabled="loading"
                      class="mr-2 delete-button"
                      fab
                      @click="removeCode(code)"
                    >
                      <v-icon class="pa-1 red--text" dark>fas fa-xs fa-trash</v-icon>
                    </button>
                    {{100 + index}}
                  </v-layout>
                  <div style="white-space: normal;">{{code.description}}</div>
                </v-layout>
              </draggable>
            </v-list>
          </v-layout>
        </v-flex>
      </v-layout>
      <v-layout v-else>
        <!-- left -->
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
        <!-- right -->
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
      <!-- left -->
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
      <!-- right -->
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
      autoGenerate: true,
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
      messagesList: [],
      locale: '',
      message: '',
      codeName: '',
      codeDescription: '',
      codeType: '',
      codeStatus: '',
      locales: [
        ['af-ZA', 'Afrikaans', 'Afrikaans'],
        ['ar', 'العربية', 'Arabic'],
        ['bg-BG', 'Български', 'Bulgarian'],
        ['ca-AD', 'Català', 'Catalan'],
        ['cs-CZ', 'Čeština', 'Czech'],
        ['cy-GB', 'Cymraeg', 'Welsh'],
        ['da-DK', 'Dansk', 'Danish'],
        ['de-AT', 'Deutsch (Österreich)', 'German (Austria)'],
        ['de-CH', 'Deutsch (Schweiz)', 'German (Switzerland)'],
        ['de-DE', 'Deutsch (Deutschland)', 'German (Germany)'],
        ['el-GR', 'Ελληνικά', 'Greek'],
        ['en-GB', 'English (UK)', 'English (UK)'],
        ['en-US', 'English (US)', 'English (US)'],
        ['es-CL', 'Español (Chile)', 'Spanish (Chile)'],
        ['es-ES', 'Español (España)', 'Spanish (Spain)'],
        ['es-MX', 'Español (México)', 'Spanish (Mexico)'],
        ['et-EE', 'Eesti', 'Estonian'],
        ['eu', 'Euskara', 'Basque'],
        ['fa-IR', 'فارسی', 'Persian'],
        ['fi-FI', 'Suomi', 'Finnish'],
        ['fr-CA', 'Français (Canada)', 'French (Canada)'],
        ['fr-FR', 'Français (France)', 'French (France)'],
        ['he-IL', 'עברית', 'Hebrew'],
        ['hr-HR', 'Hrvatski', 'Croatian'],
        ['hu-HU', 'Magyar', 'Hungarian'],
        ['id-ID', 'Bahasa Indonesia', 'Indonesian'],
        ['is-IS', 'Íslenska', 'Icelandic'],
        ['it-IT', 'Italiano', 'Italian'],
        ['ja-JP', '日本語', 'Japanese'],
        ['km-KH', 'ភាសាខ្មែរ', 'Khmer'],
        ['ko-KR', '한국어', 'Korean'],
        ['la', 'Latina', 'Latin'],
        ['lt-LT', 'Lietuvių', 'Lithuanian'],
        ['lv-LV', 'Latviešu', 'Latvian'],
        ['mn-MN', 'Монгол', 'Mongolian'],
        ['nb-NO', 'Norsk bokmål', 'Norwegian (Bokmål)'],
        ['nl-NL', 'Nederlands', 'Dutch'],
        ['nn-NO', 'Norsk nynorsk', 'Norwegian (Nynorsk)'],
        ['pl-PL', 'Polski', 'Polish'],
        ['pt-BR', 'Português (Brasil)', 'Portuguese (Brazil)'],
        ['pt-PT', 'Português (Portugal)', 'Portuguese (Portugal)'],
        ['ro-RO', 'Română', 'Romanian'],
        ['ru-RU', 'Русский', 'Russian'],
        ['sk-SK', 'Slovenčina', 'Slovak'],
        ['sl-SI', 'Slovenščina', 'Slovenian'],
        ['sr-RS', 'Српски / Srpski', 'Serbian'],
        ['sv-SE', 'Svenska', 'Swedish'],
        ['th-TH', 'ไทย', 'Thai'],
        ['tr-TR', 'Türkçe', 'Turkish'],
        ['uk-UA', 'Українська', 'Ukrainian'],
        ['vi-VN', 'Tiếng Việt', 'Vietnamese'],
        ['zh-CN', '中文 (中国大陆)', 'Chinese (PRC)'],
        ['zh-TW', '中文 (台灣)', 'Chinese (Taiwan)']
      ]
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
                codes {
                  description
                  name
                  codeType
                  index
                  message {
                    lang
                    content
                  }
                }
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
      if (val) {
        val.forEach((el, i) => {
          el.index = 100 + i
        })
        this.$apollo
          .mutate({
            mutation: gql`
              mutation setCodes(
                $projectName: String!
                $modelName: String!
                $codes: [String]
              ) {
                setCodes(
                  projectName: $projectName
                  modelName: $modelName
                  codes: $codes
                )
              }
            `,
            variables: {
              projectName: this.selected.name,
              modelName: this.selectedModel,
              codes: val.map(el => JSON.stringify(el))
            }
          })
          .then(res => {
            this.generate()
          })
          .catch(err => {
            this.$notify({
              group: 'main',
              type: 'danger',
              title: 'Error',
              text: err.message
            })
          })
      }
    }
  },
  methods: {
    pushMessage() {
      this.messagesList.push({
        lang: this.locale,
        content: this.message
      })
      this.locale = ''
      this.message = ''
    },
    removeMessage(index) {
      this.messagesList.splice(index, 1)
    },
    generate() {
      this.loading = true
      this.$apollo
        .mutate({
          mutation: gql`
            mutation generate($projectName: String!) {
              generate(projectName: $projectName)
            }
          `,
          variables: {
            projectName: this.selected.name
          }
        })
        .then(res => {
          if (!this.autoGenerate)
            this.$notify({
              group: 'main',
              type: 'success',
              title: 'Success',
              text: 'Project generated!!'
            })
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
          this.generate()
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
          this.generate()
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
        index: max ? max + 1 : 100,
        status: this.codeStatus,
        message: this.messagesList
      })
      this.messagesList = []
      this.$refs.addCode.reset()
    },
    removeCode({ index }) {
      this.codes.splice(index - 100, 1)
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
                    message {
                      lang
                      content
                    }
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
    resetModel() {
      this.selectedModel = ''
      this.messagesList = []
      this.codeName = ''
      this.codeDescription = ''
      this.codeStatus = ''
      this.codeType = ''
      this.message = ''
      this.locale = ''
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
.delete-button {
  transition: 0.3s;
}

.delete-button:hover {
  transform: scale(1.4);
}

.delete-button:focus {
  outline: none;
}
</style>
