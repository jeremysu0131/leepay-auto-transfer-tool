<template>
  <el-dialog
    title="Mark Task as Fail"
    :visible="isShowMarkAsFailDialog"
    width="80%"
    @close="closeDialog"
  >
    <el-form
      ref="taskFailForm"
      :model="form"
      :rules="rules"
      label-position="right"
      @submit.native.prevent
    >
      <el-form-item
        label="Note"
        label-width="60px"
      >
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="4"
        />
      </el-form-item>
    </el-form>
    <div
      slot="footer"
      class="dialog-footer"
    >
      <el-button
        type="danger"
        size="small"
        :loading="isHandlingFail"
        @click="handleConfirm"
      >
        Confirm
      </el-button>
      <el-button
        size="small"
        @click="closeDialog"
      >
        Cancel
      </el-button>
    </div>
  </el-dialog>
</template>

<script lang="ts">
import { Component, Vue, Watch, Prop } from "vue-property-decorator";
import { TaskModule } from "../../../store/modules/task";
import { AppModule } from "../../../store/modules/app";
import TaskStatusEnum from "@/enums/taskStatusEnum";
import { AccountModule } from "../../../store/modules/account";
import TaskModel from "@/models/taskModel";

@Component({
  name: "TaskFailDialog"
})
export default class extends Vue {
  mounted() {
    AppModule.HANDLE_TASK_PROCESSING(true);
  }
  private isHandlingFail = false;
  private form = {
    note: ""
  };
  private rules = {
    transferFee: [{ required: true, trigger: "blur" }]
  };

  get taskForOperation() {
    return TaskModule.selectedForOperation;
  }

  get isShowMarkAsFailDialog() {
    return AppModule.task.isShowMarkAsFailDialog;
  }

  get task() {
    return this.$store.state.task;
  }

  private handleConfirm() {
    (this.$refs.taskFailForm as any).validate(async (valid: boolean) => {
      if (valid) {
        await this.setTaskAsFail();
      } else {
        return false;
      }
    });
  }
  async setTaskAsFail() {
    try {
      this.isHandlingFail = true;

      await TaskModule.MarkTaskFail({
        task: this.taskForOperation,
        reason: this.form.note
      });
      // TaskModule.MoveCurrentTaskToLast({
      //   ...this.taskForOperation,
      //   status: TaskStatusEnum.SUCCESS
      // });
      await TaskModule.GetAll(AccountModule.current.id);
      this.$message.success("Task has been mark as fail");
      this.closeDialog();
    } catch (error) {
      this.$message.error(error.toString());
    } finally {
      AppModule.HANDLE_TASK_PROCESSING(false);
      this.isHandlingFail = false;
    }
  }
  closeDialog() {
    TaskModule.SET_SELECTED_FOR_OPERATION({} as TaskModel);
    AppModule.HANDLE_TASK_PROCESSING(false);
    AppModule.HANDLE_MARK_AS_FAIL_DIALOG(false);

    this.form = { note: "" };
  }
}
</script>
<style lang="scss" scoped>
.dialog-footer {
  text-align: center;
}
</style>
