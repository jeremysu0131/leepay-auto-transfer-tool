import PayeeAccountModel from "./payeeAccountModel";
import TaskTypeEnum from "../enums/taskTypeEnum";
import TaskDetailModel from "./taskDetailModel";
import TaskStatusEnum from "@/enums/taskStatusEnum";

export default class LastSelectedTaskDetailModel extends TaskDetailModel {
  status: string = TaskStatusEnum.TO_PROCESS;
}
