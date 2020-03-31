<template>
  <div>
    <div class="task-list__container">
      <task-header />
      <task-list />
    </div>
    <transfer />
    <!-- <TaskSuccessDialog /> -->
    <TaskFailDialog />
    <!-- <TaskProcessDialog /> -->
  </div>
</template>

<script lang="ts">
import { TaskFailDialog, TaskProcessDialog, TaskSuccessDialog, TaskHeader, TaskList, Transfer } from "./components";
import { Component, Vue, Watch } from "vue-property-decorator";

@Component({
  name: "TaskPanel",
  components: {
    TaskHeader,
    TaskFailDialog,
    TaskList,
    Transfer
  }
})
export default class extends Vue {}
</script>

<style lang="scss">
@import "@/styles/_variables.scss";

.task-list {
  &__container {
    &-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 50px;
      margin-bottom: 15px;
      padding: 8px 16px;
      background-color: #f2f2f2;
      border-radius: 4px;

      .current-account {
        font-size: $fontBase;
      }

      .bo-balance {
        font-size: $fontBase;
      }

      .fetch-task {
        text-align: right;
      }
    }

    &-body {
      margin: 8px 8px 0;
      .task-operator__button {
        padding: 6px 8px;
        margin: 0;
      }
    }
  }
}
.el-row--popover {
  &__el-col {
    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }
  &__el-button {
    width: 155px;
    text-align: left;
    &--icon {
      margin-right: 8px;
    }
  }
}

.el-table .executing-row > td {
  background: rgb(240, 249, 235) !important;
}
</style>
