/*
 * @Author: liubo
 * @CreatDate: 2019-05-31 15:05:53
 * @Describe: groovy编辑器
 */

import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import * as CodeMirror from "codemirror/lib/codemirror";
import "codemirror/mode/groovy/groovy";
import "codemirror/addon/selection/active-line";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/indent-fold";
import "codemirror/addon/fold/comment-fold";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/fold/foldgutter.css";
import "codemirror/theme/neo.css";
import "codemirror/theme/material.css";
import "./index.less";

class GroovyEditor extends PureComponent {

	constructor(props) {
		super(props);
		this.ref = React.createRef();
	}

	state = {
		posLeft: 0,
		posTop: 0,
		tipShow: false,
		blurFlag: false,
		defaultKeywords: [
			// groovy 关键词
			"as", "catch", "def", "enum", "for", "import", "new", "super", "throws", "while",
			"assert", "class", "default", "extends", "goto", "in", "null", "switch", "trait", "break",
			"const", "do", "false", "if", "instanceof", "package", "this", "true", "case", "continue", "else",
			"finally", "implements", "interface", "return", "throw", "try",
			// java 关键词
			"abstract", "transient", "int", "strictfp", "synchronized", "boolean", "char", "do",
			"final", "private", "short", "void", "double", "long", "protected", "static", "volatile",
			"byte", "float", "native", "public",
			// JDK 常用类
			"System", "Runtime", "String", "StringBuffer", "StringBuilder", "Date", "DateFormat",
			"SimpleDateFormat", "Calendar", "GregorianGalendar", "Math", "Integer", "Double", "Float",
			"Boolean", "List", "HashMap", "Map", "ArrayList", "Arrays", "Random", "Iterator"
		],
		concatKeywords: [],
		list: []
	};

	componentDidMount() {
		const { defaultKeywords } = this.state;
		const { keywords } = this.props;
		const { current } = this.ref;

		let arr = [...new Set(defaultKeywords.concat(keywords))];
		this.setState({
			concatKeywords: arr,
			list: arr
		});
		const { readOnly, defaultCode, activeLine, fold, theme } = this.props;
		this.CodeMirrorEditor = CodeMirror.fromTextArea(current, {
			mode: "text/x-groovy",
			theme: theme === "night" ? "material" : "neo",
			lineNumbers: true,
			matchBrackets: true,
			styleActiveLine: activeLine,
			foldGutter: fold,
			gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
			readOnly: readOnly ? "nocursor" : false,
			extraKeys: {
				"Tab": function (cm) {
					var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
					cm.replaceSelection(spaces);
				}
			}
		});
		this.CodeMirrorEditor.setValue(defaultCode);
		this.CodeMirrorEditor.on("cursorActivity", (cm) => {
			this.cursorActivity(cm);
		});
		this.CodeMirrorEditor.on("changes", (cm) => {
			if (this.props.onChange) {
				this.props.onChange(cm.getValue());
			}
		});
		this.CodeMirrorEditor.on("focus", (cm) => {
			this.cursorActivity(cm);
			this.setState({ blurFlag: true });
		});
		document.body.addEventListener("click", this.listenner);
		this.CodeMirrorEditor.addKeyMap({
			"Up": (cm) => {
				const { tipShow } = this.state;
				if (tipShow) {
					this.enterFuc("up");
				} else {
					cm.execCommand("goLineUp");
				}
			},
			"Down": (cm) => {
				const { tipShow } = this.state;
				if (tipShow) {
					this.enterFuc("down");
				} else {
					cm.execCommand("goLineDown");
				}
			},
			"Enter": (cm) => {
				const { tipShow } = this.state;
				if (tipShow) {
					this.enterFuc("enter");
				} else {
					cm.execCommand("newlineAndIndent");
				}
			}
		});
	}

	componentDidUpdate(prevProps) {
		const code = prevProps.code;
		const nextCode = this.props.code;
		if (code !== nextCode) {
			this.CodeMirrorEditor.setValue(nextCode);
		}
	}

	componentWillUnmount() {
		document.body.removeEventListener("click", this.listenner);
	}

	listenner = (e) => {
		const targetClassName = e.target.className;
		if (typeof (targetClassName) !== "string") return;
		const list = [
			"codemirror-tipbox"
		];
		const returnFalse = list.find(item => targetClassName.includes(item));
		if (returnFalse) return false;
		const targetPath = e.path;
		let flag = false;
		targetPath.forEach(item => {
			if (item.className) {
				if (typeof (item.className) !== "string") return;
				if (item.className.includes("CodeMirror-line") ||
					item.className.includes("CodeMirror-linenumber")
				) {
					flag = true;
				}
			}
		});
		if (flag) {
			this.setState({ blurFlag: true });
		} else {
			this.setState({
				blurFlag: false,
				tipShow: false
			});
		}
		if (targetClassName === "CodeMirror-scroll") {
			this.setState({ blurFlag: true });
		}
	}

	cursorActivity = (cm) => {
		const { readOnly } = this.props;
		if (readOnly) return;
		const getCursor = cm.getCursor();
		const pos = cm.cursorCoords(getCursor);
		const getLineInfo = cm.getLine(getCursor.line);
		const cursorBeforeOneChar = getLineInfo.substring(0, getCursor.ch);
		const lastIndex = cursorBeforeOneChar.lastIndexOf(" ", getCursor.ch);
		const content = cursorBeforeOneChar.substring(lastIndex + 1, getCursor.ch);
		const { concatKeywords } = this.state;
		const findObj = concatKeywords.find(item => item.toLowerCase().includes(content.toLowerCase()));
		if (findObj && content) {
			this.setState({
				posLeft: pos.left,
				posTop: pos.top + 20,
				tipShow: true
			});
			this.search(content);
		} else {
			this.setState({
				tipShow: false
			});
		}
	}

	search(val) {
		const { concatKeywords } = this.state;
		let arr = [];
		concatKeywords.forEach(item => {
			if (item.toLowerCase().includes(val.toLowerCase())) {
				arr.push(item);
			}
		});
		this.setState({
			list: arr
		});
		this.defaultFirst(val, arr);
	}

	defaultFirst = (val, list) => {
		let findLi = "cm-field-li";
		let active = "cm-active";
		const nodeList = document.querySelectorAll(`.${findLi}`);
		if (nodeList.length > 0) {
			for (let i = 0; i < nodeList.length; i++) {
				nodeList[i].className = findLi;
			}
			nodeList[0].className = `${active} ${findLi}`;
		}
		if (list && list.length === 1 && list[0] === val) {
			this.setState({
				tipShow: false
			});
		}
	}

	enterFuc = (type) => {
		let findLi = "cm-field-li";
		let active = "cm-active";
		const nodeList = document.querySelectorAll(`.${findLi}`);
		const length = nodeList.length;
		let index = 0;
		for (let i = 0; i < length; i++) {
			if (nodeList[i].className.includes(active)) {
				index = i;
			}
		}
		if (type === "up") {
			nodeList[index].className = findLi;
			if (index === 0) {
				nodeList[index].className = `${active} ${findLi}`;
			} else {
				nodeList[index - 1].className = `${active} ${findLi}`;
			}
		} else if (type === "down") {
			nodeList[index].className = findLi;
			if (index === length - 1) {
				nodeList[index].className = `${active} ${findLi}`;
			} else {
				nodeList[index + 1].className = `${active} ${findLi}`;
			}
		} else if (type === "enter") {
			const node = document.querySelector(`.${active}`);
			this.handleClick(node.innerText);
			setTimeout(() => {
				this.setState({
					tipShow: false
				});
			}, 100);
		}
		document.querySelector(`.${active}`).scrollIntoViewIfNeeded();
	}

	handleClick(item) {
		const getCursor = this.CodeMirrorEditor.getCursor();
		const getLineInfo = this.CodeMirrorEditor.getLine(getCursor.line);
		const cursorBeforeOneChar = getLineInfo.substring(0, getCursor.ch);
		const lastIndex = cursorBeforeOneChar.lastIndexOf(" ", getCursor.ch);
		this.CodeMirrorEditor.setSelection(
			{ line: getCursor.line, ch: lastIndex + 1 },
			{ line: getCursor.line, ch: getCursor.ch },
		);
		this.CodeMirrorEditor.replaceSelection(item);
		this.CodeMirrorEditor.setCursor(getCursor.line, lastIndex + 1 + item.length);
		this.CodeMirrorEditor.focus();
		this.setState({
			tipShow: false
		});
	}

	render() {
		const { posLeft, posTop, tipShow, list } = this.state;
		const { height } = this.props;

		return (
			<div className="m-groovy-editor" style={height ? { height: height + "px" } : {}}>
				<textarea ref={this.ref}></textarea>
				{/* @弹框 */}
				<div
					className="codemirror-tipbox"
					style={{
						left: `${posLeft}px`,
						top: `${posTop}px`,
						display: tipShow ? "inline-block" : "none"
					}}
				>
					<ul className="cm-field-ul">
						{
							list && list.length > 0 &&
							list.map((item, index) => {
								return (
									<li
										key={index}
										className={index === 0 ? "cm-active cm-field-li" : "cm-field-li"}
										onClick={() => this.handleClick(item)}
									>
										{item}
									</li>
								);
							})
						}
					</ul>
				</div>
			</div>
		);
	}
}

GroovyEditor.propTypes = {
	id: PropTypes.string,
	defaultCode: PropTypes.string,
	code: PropTypes.string,
	height: PropTypes.number,
	theme: PropTypes.string,
	activeLine: PropTypes.bool,
	fold: PropTypes.bool,
	readOnly: PropTypes.bool,
	keywords: PropTypes.array
};

GroovyEditor.defaultProps = {
	defaultCode: "",
	activeLine: true,
	fold: true,
	theme: "day",
	height: 300,
	readOnly: false,
	keywords: []
};

export default GroovyEditor;

