/**
 * math-functions.js
 * 提供用于计算杆件阵列高度的数学函数
 */

export const ArrayHeightFunctions = {
    /**
     * 正弦波函数: sin(πx/scale) * sin(πy/scale)
     * @param {number} x - 归一化的x坐标 (0-1)
     * @param {number} y - 归一化的y坐标 (0-1)
     * @param {number} scaleFactor - 缩放因子，影响波浪的疏密
     * @param {number} gridXSize - X方向的网格点数
     * @param {number} gridYSize - Y方向的网格点数
     * @returns {number} - 归一化的高度值 (-1 to 1)
     */
    sine: (x, y, scaleFactor, gridXSize, gridYSize) => {
        // 将x, y从网格索引转换为映射到[-scaleFactor*PI, scaleFactor*PI]的值，以便控制波的周期
        const scaledX = (x / (gridXSize -1)) * 2 * Math.PI * scaleFactor - (Math.PI * scaleFactor);
        const scaledY = (y / (gridYSize -1)) * 2 * Math.PI * scaleFactor - (Math.PI * scaleFactor);
        return Math.sin(scaledX) * Math.sin(scaledY);
    },

    /**
     * 高斯函数: exp(-((x-cx)²+(y-cy)²)/factor)
     * @param {number} x - 归一化的x坐标 (0-1)
     * @param {number} y - 归一化的y坐标 (0-1)
     * @param {number} scaleFactor - 影响高斯函数的宽度/陡峭度 (较小值更陡峭)
     * @param {number} gridXSize - X方向的网格点数
     * @param {number} gridYSize - Y方向的网格点数
     * @returns {number} - 归一化的高度值 (0 to 1)
     */
    gaussian: (x, y, scaleFactor, gridXSize, gridYSize) => {
        const centerX = (gridXSize - 1) / 2;
        const centerY = (gridYSize - 1) / 2;
        // scaleFactor在这里作为高斯函数的分母中的一个因子，控制"山峰"的胖瘦
        // 更大的scaleFactor导致更平缓的山峰
        const adjustedScaleFactor = scaleFactor * 100; // 调整以获得更直观的控制范围
        const distSq = Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2);
        return Math.exp(-distSq / (2 * adjustedScaleFactor * adjustedScaleFactor));
    },

    /**
     * 波纹函数: sin(√( (x-cx)²+(y-cy)² ) / scale)
     * @param {number} x - 归一化的x坐标 (0-1)
     * @param {number} y - 归一化的y坐标 (0-1)
     * @param {number} scaleFactor - 影响波纹的频率/密度
     * @param {number} gridXSize - X方向的网格点数
     * @param {number} gridYSize - Y方向的网格点数
     * @returns {number} - 归一化的高度值 (-1 to 1)
     */
    ripple: (x, y, scaleFactor, gridXSize, gridYSize) => {
        const centerX = (gridXSize - 1) / 2;
        const centerY = (gridYSize - 1) / 2;
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        // scaleFactor 控制波纹的密度，值越小波纹越密
        return Math.sin(distance / (scaleFactor * 2 + 0.1)); // 调整scaleFactor的影响范围
    },

    /**
     * 线性倾斜: (x + y) / (gridXSize + gridYSize)
     * @param {number} x - 归一化的x坐标 (0-1)
     * @param {number} y - 归一化的y坐标 (0-1)
     * @param {number} scaleFactor - 此函数中未使用，但保留参数一致性
     * @param {number} gridXSize - X方向的网格点数
     * @param {number} gridYSize - Y方向的网格点数
     * @returns {number} - 归一化的高度值 (0 to 1)
     */
    linear_slope: (x, y, scaleFactor, gridXSize, gridYSize) => {
        return (x / (gridXSize -1) + y / (gridYSize -1)) / 2; // 结果范围 0 to 1
    },

    /**
     * 山峰函数: cos(x/scale) * cos(y/scale)
     * @param {number} x - 归一化的x坐标 (0-1)
     * @param {number} y - 归一化的y坐标 (0-1)
     * @param {number} scaleFactor - 影响山峰的疏密
     * @param {number} gridXSize - X方向的网格点数
     * @param {number} gridYSize - Y方向的网格点数
     * @returns {number} - 归一化的高度值 (-1 to 1)
     */
    peak: (x, y, scaleFactor, gridXSize, gridYSize) => {
        const scaledX = (x / (gridXSize - 1)) * 2 * Math.PI * scaleFactor - (Math.PI * scaleFactor);
        const scaledY = (y / (gridYSize - 1)) * 2 * Math.PI * scaleFactor - (Math.PI * scaleFactor);
        return Math.cos(scaledX) * Math.cos(scaledY);
    }
};

/**
 * 获取选定的高度计算函数
 * @param {string} functionName - 函数名称
 * @returns {Function} - 计算函数，如果未找到则返回null
 */
export function getArrayHeightFunction(functionName) {
    return ArrayHeightFunctions[functionName] || null;
} 