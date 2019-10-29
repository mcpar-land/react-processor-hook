import React, {useReducer, useEffect} from 'react';

export type StepFunction = (input?: any) => Promise<any>;

export type Step = [string, StepFunction];
export type StepArray = Step[];


export interface ProcessorState {
	output: any | undefined,
	complete: boolean,
	error: Error | undefined,
	step: string,
	stepIndex: number
};

export type ProcessorActionType = 'error' | 'next' | 'complete';
export interface ProcessorAction{
	type: ProcessorActionType,
	error?: Error,
	output?: any
};

/**
 * 
 * @param input The starting input 
 * @param processors 
 */
export const useProcessor = (processors: StepArray, input?: any) : ProcessorState => {

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
				...state,
				complete: true,
				error: action.error,
			};
			case 'next': return {
				...state,
				stepIndex: state.stepIndex+1,
				step: processors[state.stepIndex+1][0],
			};
			case 'complete': return {
				...state,
				complete: true,
				output: action.output,
			}
			default: return state;
		}
	}

	const [state, dispatch] = useReducer(reducer, initialState);

	const doProcessor = async (
		currentData: any,
		processor: Step
	): Promise<any> => {
		console.log('doing step', processor[0]);
		const newOutput = await processor[1](currentData);
		console.log(newOutput);
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
				console.log(err);
				break;
			}
		}
		if(!didError) {
			dispatch({type: 'complete', output: currentData});
		}
	};

	useEffect(() => {
		processorChain();
	}, []);

	return state;
}