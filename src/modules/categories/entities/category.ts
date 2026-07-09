export type TransactionType = "INCOME" | "EXPENSE";

export interface CategoryProps {
  id: string;
  name: string;
  type: TransactionType;
}

export class Category {
  private props: CategoryProps;

  constructor(props: CategoryProps) {
    this.props = props;
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get type() {
    return this.props.type;
  }

  toJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      type: this.props.type,
    };
  }
}
