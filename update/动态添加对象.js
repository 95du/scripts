// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: user-astronaut;
var obj1 = {
  "apple": 100,
  "pear": 200
}
    
var obj2 = {
  "cherry": 300
}

var obj3 = {
  ...obj1,
  ...obj2
}

console.log(
  JSON.stringify(obj3, null, 2)
)


// 第二
let arr = [];
const obj = {
  '小黄': 23,
  '小王': 20,
  '小沈': 18,
  '小宋': 11
};
for (const key in obj) {
  const param = {};
  param['name'] = key;
  param['age'] = obj[key];
  arr.push(param);
}

// or
Object.keys(obj).forEach(key => {
  const param = {};
  param['name'] = key;
  param['age'] = obj[key];
  arr.push(param);
})

console.log(
  JSON.stringify(arr, null,2)
)


// 翻转数组补充
function reserve(arr) {
	// if (arr instanceof Array) {
	//第一种判断是否为数组的方式
  if(Array.isArray(arr)){
  //第二种判断是否为数组的方式
    var newArr = [];
    newArr.length;
    for (var i = arr.length - 1 ; i >= 0; i--) {
      newArr[newArr.length] = arr[i];
    }
    return newArr;
  } else {
    return '这个参数要求必须是数组格式'
  }
}
			console.log(reserve([1,3,4,5,6]));
//正常将数组进行翻转然后输出
			console.log(reserve(1,3,4,5,6));
//因为该数组传入的不是数组，所以正常打印输出这个参数要求必须是数组格式



// 将多个数组合并为1个数组
var arr1=['a','b','c'];
var arr2=["1","2","3"];
var arr3 = arr1.concat(arr2);
console.log(arr3);



var arr1=[1,4,56,87,34,97];
arr1.sort(function(a,b){
  return a - b;  //按照升序的顺序排列
  // return b - a;  //按照降序的顺序排列
});
console.log(arr1);

