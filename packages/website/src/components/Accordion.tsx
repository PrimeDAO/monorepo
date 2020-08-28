// Libraries
import React from 'react';

interface IProps {
  headline: React.ReactElement|string;
  content: React.ReactElement|string;
}

class Accordion extends React.Component<IProps, { isCollapsed: boolean }> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      isCollapsed: false,
    };
  }

  private handleClick = () => {
    return this.setState({ isCollapsed: !this.state.isCollapsed });
  }

  render(): React.ReactElement<any> {
    return (
      <div className="Accordion">
        <div
          className={`Headline ${
            this.state.isCollapsed ? 'Headline--collapsed' : ''
          }`}
          onClick={this.handleClick}
        >
          <span>{this.props.headline}</span>
        </div>
        <div className="Content">
          <span>{this.props.content}</span>
        </div>
      </div>
    );
  }
}

export default Accordion;
