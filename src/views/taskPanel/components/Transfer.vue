<template>
  <div class="transfer__container">
    <div class="transfer__last-task-container">
      <div class="last-task__header">
        Last Task
      </div>
      <div class="last-task__body">
        <div class="detail">
          <div>
            <div>ID:</div>
            <div>Account Group:</div>
            <div>Merchant:</div>
            <div>Receiver:</div>
            <div>Bank:</div>
            <div>A/C Number:</div>
            <div>Request Amount:</div>
            <div>Status:</div>
          </div>
          <div class="detail-data">
            <div v-if="lastSelectedTask">
              {{ lastSelectedTask.id }}
            </div>
            <div v-if="lastSelectedTask && lastSelectedTask.bank">
              {{ card.currentDetail.channelGroup || ' - ' }}
            </div>
            <div v-if="lastSelectedTask">
              {{ lastSelectedTask.merchantName }}
            </div>
            <div v-if="lastSelectedTask ">
              {{ lastSelectedTask.receiverName }}
            </div>
            <div v-if="lastSelectedTask && lastSelectedTask.bank">
              {{ lastSelectedTask.bank.englishName }}
            </div>
            <div v-if="lastSelectedTask && lastSelectedTask.bank">
              {{ lastSelectedTask.bank.cardNumber }}
            </div>
            <div v-if="lastSelectedTask">
              {{ lastSelectedTask.requestAmount }}
            </div>
            <div v-if="lastSelectedTask">
              {{ lastSelectedTask.toolStatus }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      :class="
        selectedTask?
          'transfer__current-task-container--selected' :
          'transfer__current-task-container--unselect'"
    >
      <div class="current-task__header">
        Current Task
      </div>
      <div class="current-task__body">
        <div class="detail">
          <div>
            <div>ID:</div>
            <div>Account Group:</div>
            <div>Merchant:</div>
            <div>Receiver:</div>
            <div>Bank:</div>
            <div>A/C Number:</div>
            <div>Request Amount:</div>
          </div>
          <div class="detail-data">
            <div v-if="selectedTask">
              {{ selectedTask.id }}
            </div>
            <div v-if="selectedTask">
              {{ card.currentDetail.channelGroup || ' - ' }}
            </div>
            <div v-if="selectedTask">
              {{ selectedTask.merchantName }}
            </div>
            <div v-if="selectedTask ">
              {{ selectedTask.receiverName }}
            </div>
            <div v-if="selectedTask && selectedTask.bank">
              {{ selectedTask.bank.englishName }}
            </div>
            <div v-if="selectedTask && selectedTask.bank">
              {{ selectedTask.bank.cardNumber }}
            </div>
            <div v-if="selectedTask">
              {{ selectedTask.requestAmount }}
            </div>
          </div>
        </div>
        <div class="workflow">
          <table class="workflow-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Step name</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(flow,index) in worker.workflow"
                :key="index"
                :style="flowStyle(flow.status)"
                @click="handleRowClick(flow)"
              >
                <td class="transfer__task-workflow-status">
                  <svg-icon :icon-class="iconClass(flow.status)" />
                </td>
                <td class="transfer__task-workflow-name">
                  {{ flow.name }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div
        v-if="selectedTask&&selectedTask.id"
        class="current-task__footer"
      >
        <div class="prompt">
          Please select carefully of the result ...
        </div>
        <div class="operator">
          <el-button
            size="mini"
            type="success"
            :loading="isHandlingSuccess"
            :disabled="isHandlingFail || isHandlingToConfirm"
            @click="markAsSuccess()"
          >
            Success
          </el-button>
          <el-button
            size="mini"
            type="danger"
            :loading="isHandlingFail"
            @click="markAsFail(true)"
          >
            Fail
          </el-button>
          <el-button
            size="mini"
            :disabled="isHandlingSuccess || isHandlingFail"
            :loading="isHandlingToConfirm"
            @click="markAsToConfirm(true, selectedTask)"
          >
            To Confirm
          </el-button>
          <el-button
            size="mini"
            :loading="isHandlingReassign"
            @click="markAsReassign(true)"
          >
            Re-assign
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch, Mixins } from "vue-property-decorator";
import { mapGetters } from "vuex";
// import { workflowStatusEnum } from "../../../../worker/utils/workflowHelper";
import { AccountModule } from "../../../store/modules/account";
import { TaskModule } from "../../../store/modules/task";
import { WorkerModule } from "../../../store/modules/worker";
import TaskOperationMixin from "../mixins/taskOperation";

@Component({
  name: "Transfer",
  mixins: [TaskOperationMixin]
})
export default class extends Mixins(TaskOperationMixin) {
 private isHandlingSuccess= false;
 private isHandlingFail= false;
 private isHandlingToConfirm=false;
 private isHandlingReassign= false;

 get card() {
   return AccountModule;
 }
 get task() {
   return TaskModule;
 }
 get worker() {
   return WorkerModule;
 }
 get lastSelectedTask() {
   return this.task.lastSelected;
 }
 get selectedTask() {
   return this.task.selectedDetail;
 }
}
// methods: {
//   iconClass(status) {
//     switch (status) {
//       case workflowStatusEnum.RUNNING:
//         return "workflow-running";
//       case workflowStatusEnum.FAIL:
//         return "workflow-fail";
//       case workflowStatusEnum.SUCCESS:
//         return "workflow-success";
//       default:
//         return "workflow-pending";
//     }
//   },
//   flowStyle(status) {
//     switch (status) {
//       case workflowStatusEnum.RUNNING:
//         return { "background-color": "#E6A23C" };
//       case workflowStatusEnum.FAIL:
//         return { "background-color": "#F56C6C" };
//       case workflowStatusEnum.SUCCESS:
//         return { "background-color": "#67C23A" };
//       default:
//         return { "background-color": "" };
//     }
//   },
//   async handleRowClick(val) {
//     try {
//       console.log(val);
//       if (process.env.NODE_ENV === "development") { this.$store.dispatch("RunSelectedFlow", val.name); }
//     } catch (error) {
//       this.$store.dispatch("SetConsole", {
//         message: error.toString(),
//         level: "debug"
//       });
//     }
//   }
// }
</script>

<style lang="scss" scoped>
@import "../../../styles/variables.scss";
.transfer {
  &__container {
    font-size: $fontExtraSmall;
    display: flex;
    margin-top: 16px;
  }
  &__last-task-container {
    flex: 1;
    background: rgb(233, 233, 235);
    border-radius: 4px;
    .last-task {
      &__header {
        border-radius: 4px 4px 0 0;
        font-size: $fontBase;
        font-weight: bold;
        margin-bottom: 8px;
        background: rgb(244, 244, 245);
        padding: 8px;
      }
      &__body {
        padding: 8px 8px 0;
        display: flex;
        justify-content: space-between;
        .detail {
          flex: 1;
          display: flex;
          div {
            margin: 0 0 8px 0;
          }
          .detail-data {
            padding-left: 8px;
          }
        }
      }
    }
  }
  &__current-task-container--unselect {
    margin-left: 8px;
    flex: 2;
    display: flex;
    flex-direction: column;
    background: rgb(233, 233, 235);
    border-radius: 4px;
    .current-task {
      &__header {
        background: rgb(244, 244, 245);
        font-size: $fontBase;
        font-weight: bold;
        padding: 8px;
        margin-bottom: 8px;
      }
      &__body {
        padding: 8px 8px 0;
        display: flex;
        justify-content: space-between;
        .detail {
          flex: 1;
          display: flex;
          div {
            margin: 0 0 8px 0;
          }
          .detail-data {
            padding-left: 8px;
            font-weight: bold;
          }
        }
        .workflow {
          flex: 1;
          margin-left: 4px;
          &-table {
            width: 100%;
            border-collapse: collapse;

            th {
              font-weight: normal;
              color: #606266;
              padding: 8px 16px;
              border: 1px solid #ddd;
              font-size: $fontBase;

              &:nth-child(1) {
                text-align: center;
              }
              &:nth-child(2) {
                text-align: left;
              }
            }

            tr {
              &:hover {
                background-color: #f5f5f5;
              }

              td {
                border: 1px solid #ddd;
                &.transfer__task-workflow-name {
                  padding: 8px 16px;
                }
                &.transfer__task-workflow-status {
                  text-align: center;
                }
              }
            }
          }
        }
      }
      &__footer {
        padding: 0 8px 8px;
        .prompt {
          text-align: center;
          margin: 16px 0 8px;
        }
        .operator {
          display: flex;
          justify-content: center;
          .el-button {
            width: 120px;
          }
        }
      }
    }
  }

  &__current-task-container--selected {
    margin-left: 8px;
    flex: 2;
    display: flex;
    flex-direction: column;
    background: rgb(225, 243, 216);
    border-radius: 4px;
    .current-task {
      &__header {
        background-color: #f0f9eb;
        font-size: $fontBase;
        font-weight: bold;
        padding: 8px;
        margin-bottom: 8px;
      }
      &__body {
        padding: 8px 8px 0;
        display: flex;
        justify-content: space-between;
        .detail {
          flex: 1;
          display: flex;
          div {
            margin: 0 0 8px 0;
          }
          .detail-data {
            padding-left: 8px;
            font-weight: bold;
          }
        }
        .workflow {
          flex: 1;
          margin-left: 4px;
          &-table {
            width: 100%;
            border-collapse: collapse;

            th {
              font-weight: normal;
              color: #606266;
              padding: 8px 16px;
              border: 1px solid #ddd;
              font-size: $fontBase;

              &:nth-child(1) {
                text-align: center;
              }
              &:nth-child(2) {
                text-align: left;
              }
            }

            tr {
              &:hover {
                background-color: #f5f5f5;
              }

              td {
                border: 1px solid #ddd;
                &.transfer__task-workflow-name {
                  padding: 8px 16px;
                }
                &.transfer__task-workflow-status {
                  text-align: center;
                }
              }
            }
          }
        }
      }
      &__footer {
        padding: 0 8px 8px;
        .prompt {
          text-align: center;
          margin: 16px 0 8px;
        }
        .operator {
          display: flex;
          justify-content: center;
          .el-button {
            width: 120px;
          }
        }
      }
    }
  }
}
</style>
