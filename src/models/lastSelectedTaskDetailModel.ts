import PayeeAccountModel from "./payeeAccountModel";
import TaskTypeEnum from "../enums/taskTypeEnum";
import TaskDetailViewModel from "./taskDetailViewModel";
import TaskStatusEnum from "@/enums/taskStatusEnum";

export default class LastSelectedTaskDetailViewModel extends TaskDetailViewModel {
  status: string = TaskStatusEnum.TO_PROCESS;
}
