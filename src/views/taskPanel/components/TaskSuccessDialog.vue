<template>
  <el-dialog
    title="Mark Task as Success"
    :visible="isShowMarkAsSuccessDialog"
    width="80%"
    @close="closeDialog"
  >
    <el-form
      ref="taskSuccessForm"
      :model="form"
      :rules="rules"
      label-position="right"
      @submit.native.prevent
    >
      <el-form-item
        label="Bank Charge"
        label-width="120px"
        prop="transferFee"
      >
        <el-input
          v-model.number="form.transferFee"
          type="number"
        />
      </el-form-item>
      <el-form-item
        label="Note"
        label-width="120px"
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
        type="success"
        size="small"
        :loading="isHandlingSuccess"
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
import { AppModule } from "../../../store/modules/app";
import TaskStatusEnum from "@/enums/taskStatusEnum";
import { AccountModule } from "@/store/modules/account";
import { TaskModule } from "@/store/modules/task";
import TaskDetailViewModel from "../../../models/taskDetailViewModel";

@Component({
  name: "TaskSuccessDialog"
})
export default class extends Vue {
  get selectedTaskForOperation() {
    return TaskModule.selectedForOperation;
  }
  get isShowMarkAsSuccessDialog() {
    return AppModule.task.isShowMarkAsSuccessDialog;
  }

  private isHandlingSuccess = false;
  private form = {
    transferFee: 0,
    note: ""
  };
  private rules = {
    transferFee: [{ required: true, trigger: "blur" }]
  };

  private handleConfirm() {
    (this.$refs.taskSuccessForm as any).validate(async (valid: boolean) => {
      if (valid) {
        await this.setTaskAsSuccess();
      } else {
        return false;
      }
    });
  }
  private async setTaskAsSuccess() {
    try {
      this.isHandlingSuccess = true;
      TaskModule.SET_BANK_CHARGE_FOR_OPERATION(this.form.transferFee);
      TaskModule.SET_BANK_REMARK_FOR_OPERATION(this.form.note);

      let taskDetailVM = await TaskModule.GetDetail({
        id: this.selectedTaskForOperation.id,
        withdrawId: this.selectedTaskForOperation.withdraw.id,
        amount: this.selectedTaskForOperation.amount
      });
      taskDetailVM.status = TaskStatusEnum.SUCCESS;

      await TaskModule.MarkTaskSuccess(this.selectedTaskForOperation);
      TaskModule.MoveCurrentTaskToLast(taskDetailVM);
      await TaskModule.GetAll(AccountModule.current.id);

      this.$message.success("Task has been mark as success");
      this.closeDialog();
    } catch (error) {
      this.$message.error(error.toString());
    } finally {
      // AppModule.HANDLE_TASK_PROCESSING(false);
      this.isHandlingSuccess = false;
    }
  }
  private closeDialog() {
    // TaskModule.SET_SELECTED_FOR_OPERATION(new TaskDetailViewModel());
    AppModule.HANDLE_TASK_PROCESSING(false);
    AppModule.HANDLE_MARK_AS_SUCCESS_DIALOG(false);

    this.form = {
      transferFee: 0,
      note: ""
    };
  }
}
</script>
<style lang="scss" scoped>
.dialog-footer {
  text-align: center;
}
</style>
