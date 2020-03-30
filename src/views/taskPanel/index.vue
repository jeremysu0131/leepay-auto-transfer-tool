<template>
  <div>
    <TaskList />
    <Transfer />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { TaskList, Transfer } from "./components";

@Component({
  name: "TaskPanel",
  components: {
    TaskList,
    Transfer
  }
})
export default class extends Vue {}
</script>
