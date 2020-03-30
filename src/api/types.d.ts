export interface IArticleData {
  id: number;
  status: string;
  title: string;
  abstractContent: string;
  fullContent: string;
  sourceURL: string;
  imageURL: string;
  timestamp: string | number;
  platforms: string[];
  disableComment: boolean;
  importance: number;
  author: string;
  reviewer: string;
  type: string;
  pageviews: number;
}

export interface IUserData {
  firstName: string;
  id: number;
  lastLoginAt: Date;
  lastName: string;
  status: string;
  username: string;
}
