import { RiLoader5Fill } from "react-icons/ri";
import cx from "classnames";

export default function ChartWrapper(props) {
  const { title, loading, controls, viewState = {}, togglePercentView } = props;

  return (
    <>
      <div className="chart-header">
        <h3>{title}</h3>
        {controls && (
          <div className="chart-controls">
            {controls.convertToPercents && (
              <div
                className={cx({
                  "chart-control-checkbox": true,
                  active: viewState.isPercentsView,
                })}
                onClick={togglePercentView}
              >
                %
              </div>
            )}
          </div>
        )}
      </div>
      {loading && <RiLoader5Fill size="3em" className="loader" />}
      {props.children}
    </>
  );
}
