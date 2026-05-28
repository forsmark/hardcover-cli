export const ME_QUERY = `
  query Me {
    me {
      id
      username
      name
      bio
      books_count
      followers_count
      followed_users_count
      pro
    }
  }
`;

export const ME_ID_QUERY = `
  query MeId {
    me { id }
  }
`;

export const BOOKS_BY_PK_QUERY = `
  query BookById($id: Int!) {
    books_by_pk(id: $id) {
      id
      title
      subtitle
      pages
      rating
      contributions {
        author {
          name
        }
      }
    }
  }
`;

export const SEARCH_QUERY = `
  query Search($query: String!, $queryType: String!, $perPage: Int!) {
    search(query: $query, query_type: $queryType, per_page: $perPage, page: 1) {
      ids
      results
    }
  }
`;

export function buildLibraryListQuery(statusId?: number): string {
  const where = statusId !== undefined ? `where: { status_id: { _eq: ${statusId} } }` : "";
  return `
    query LibraryList($limit: Int!) {
      me {
        id
        user_books(${where} limit: $limit order_by: { date_added: desc }) {
          id
          status_id
          rating
          date_added
          book {
            id
            title
          }
        }
      }
    }
  `;
}

export const INSERT_USER_BOOK_MUTATION = `
  mutation InsertUserBook($bookId: Int!, $statusId: Int!) {
    insert_user_book(object: { book_id: $bookId, status_id: $statusId }) {
      id
      user_book {
        id
        status_id
      }
    }
  }
`;

export function buildUpdateUserBookMutation(fields: {
  statusId?: number;
  rating?: number;
  review?: string;
}): string {
  const varDefs: string[] = ["$id: Int!"];
  const setFields: string[] = [];

  if (fields.statusId !== undefined) {
    varDefs.push("$statusId: Int!");
    setFields.push("status_id: $statusId");
  }
  if (fields.rating !== undefined) {
    varDefs.push("$rating: float8!");
    setFields.push("rating: $rating");
  }
  if (fields.review !== undefined) {
    varDefs.push("$review: String!");
    setFields.push("review: $review");
  }

  return `
    mutation UpdateUserBook(${varDefs.join(", ")}) {
      update_user_book(id: $id, object: { ${setFields.join(", ")} }) {
        id
        user_book {
          id
          status_id
          rating
          review
        }
      }
    }
  `;
}

export const DELETE_USER_BOOK_MUTATION = `
  mutation DeleteUserBook($id: Int!) {
    delete_user_book(id: $id) {
      id
    }
  }
`;

export const GOALS_LIST_QUERY = `
  query GoalsList {
    me {
      id
      goals {
        id
        metric
        goal
        progress
        state
        start_date
        end_date
      }
    }
  }
`;

export const INSERT_GOAL_MUTATION = `
  mutation InsertGoal($metric: String!, $target: Int!, $start: date!, $end: date!) {
    insert_goal(object: {
      metric: $metric
      goal: $target
      start_date: $start
      end_date: $end
      privacy_setting_id: 1
    }) {
      id
      goal {
        id
        progress
        state
      }
    }
  }
`;

export const UPDATE_GOAL_MUTATION = `
  mutation UpdateGoal($id: Int!, $target: Int!) {
    update_goal(id: $id, object: { goal: $target }) {
      id
    }
  }
`;

export const DELETE_GOAL_MUTATION = `
  mutation DeleteGoal($id: Int!) {
    delete_goal(id: $id) {
      id
    }
  }
`;
