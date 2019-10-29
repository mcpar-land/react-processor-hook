import 'jsdom-global/register';
import React from 'react';
import { expect } from 'chai';
import Enzyme, { mount, shallow, ReactWrapper } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import {
	StepArray,
	ProcessorState,
	useProcessor
} from '.';

Enzyme.configure({ adapter: new Adapter() });

const DummyComponent = (props: {input: any, processors: StepArray}) => {
	const [
		output,
		complete,
		error,
		step,
		stepIndex
	] = useProcessor(props.input, props.processors);
	return (<div>
		{ complete ? output.toString() : "Loading..." }
	</div>);
};

const mountWithProcessors = (input: any, processors: StepArray) => {
	return mount(<DummyComponent input={input} processors={processors} />);
}

const pause = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

describe("useProcessor", () => {
	it("renders", () => {
		mountWithProcessors("", []);
	});

	it("shows loading initially", () => {
		const c = mountWithProcessors("", []);
		expect(c.text()).to.equal("Loading...");
	});

	it("should run steps", async () => {
		const c = mountWithProcessors("frog", [
			["Kissing frog", async frog => {
				return "kissed frog"
			}],
			["Turning frog to prince", async frog => {
				return "prince"
			}],
			["Marrying prince", async prince => {
				return "married prince";
			}]
		]);
		expect(c.text()).to.equal("Loading...");
		c.update();
		expect(c.text()).to.equal("prince");
	});
});