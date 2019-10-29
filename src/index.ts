import React, {useReducer, useEffect} from 'react';

type ProcessorFunction = (input: any) => Promise<any>;

type Step = [string, ProcessorFunction];
export type StepArray = Step[];

export interface ProcessorState {
	output: any | undefined,
	complete: boolean,
	error: Error | undefined,
	step: string,
	stepIndex: number
};

type ProcessorActionType = 'error' | 'next' | 'complete';
interface ProcessorAction{
	type: ProcessorActionType,
	error?: Error,
	output?: any
};

export const useProcessor = (input: any, processors: StepArray) : [
	any | undefined,
	boolean,
	Error | undefined,
	string,
	number
] => {

	const initialState: ProcessorState = {
		output: undefined,
		complete: false,
		error: undefined,
		step: "",
		stepIndex: -1
	};

	const reducer: React.Reducer<ProcessorState, ProcessorAction> = (state, action) => {
		switch(action.type) {
			case 'error': return {
				complete: false,
				error: action.error,
				...state
			};
			case 'next': return {
				stepIndex: state.stepIndex+1,
				step: processors[state.stepIndex+1][0],
				...state
			};
			case 'complete': return {
				complete: true,
				output: action.output,
				...state
			}
			default: return state;
		}
	}

	const [state, dispatch] = useReducer(reducer, initialState);

	const doProcessor = async (
		currentData: any,
		processor: Step
	): Promise<any> => {
		console.log('doing step ', processor[0]);
		const newOutput = await processor[1](currentData);
		return newOutput;
	}

	const processorChain = async () => {
		let currentData = input;
		let didError = false;
		for(let i = 0; i < processors.length; i++) {
			const processor = processors[i];
			dispatch({type: 'next'});
			try {
				currentData = await doProcessor(currentData, processor);
			} catch(err) {
				dispatch({type: 'error', error: err});
				didError = true;
				break;
			}
		}
		if(!didError) {
			dispatch({type: 'complete', output: currentData});
		}
	};

	useEffect(() => {
		console.log(state.error);
		processorChain();
	}, []);

	return [
		state.output,
		state.complete,
		state.error,
		state.step,
		state.stepIndex
	];
}