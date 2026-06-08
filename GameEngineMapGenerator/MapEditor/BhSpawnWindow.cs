using System.Collections.Generic;
using Hex.Map;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhSpawnWindow : BhScreenElement
	{
		[SerializeField]
		private TextMeshProUGUI count;

		[SerializeField]
		private List<BhSpawnItemView> items;

		public void UpdateView(List<bvc> _objects, List<PropSpawn> _spawns, List<Color> _colors)
		{
		}
	}
}
