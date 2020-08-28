import React from 'react';
// import { withRouter } from 'react-router-dom';
import './LandingPage.scss';

const LandingPage = (): React.ReactElement => {
  // const NormalButton = withRouter(
  //   (props: any) => {
  //     return (
  //       <div className="button"
  //         onClick = {() => {
  //           props.history.push(props.route);
  //         }}
  //       >
  //         {props.children}
  //       </div>
  //     );
  //   }
  // );

  return (
    <div className="landingPageWrapper">
      <div>toot</div>
      <div>tank</div>
    </div>
  );
};

export default LandingPage;
