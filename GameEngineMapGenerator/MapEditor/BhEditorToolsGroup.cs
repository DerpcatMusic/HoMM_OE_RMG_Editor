using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhEditorToolsGroup : MonoBehaviour
	{
		[SerializeField]
		private List<BhToolVariants> variants;

		[SerializeField]
		private List<BhEditorToolButton> tools;

		private BhEditorToolButton buqb;

		public IReadOnlyList<BhEditorToolButton> cmov => null;

		public void npp(BhEditorToolButton a)
		{
		}

		public void npq()
		{
		}
	}
}
