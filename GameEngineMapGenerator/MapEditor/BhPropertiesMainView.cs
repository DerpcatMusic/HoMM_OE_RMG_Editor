using System.Collections.Generic;
using Hex.Map;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace Hex.MapEditor
{
	public class BhPropertiesMainView : bso
	{
		[SerializeField]
		private RectTransform rect;

		[SerializeField]
		private GameObject descriptionRoot;

		[SerializeField]
		private GameObject tagRoot;

		[SerializeField]
		private GameObject raceRoot;

		[SerializeField]
		private GameObject tierRoot;

		[SerializeField]
		private GameObject rotRoot;

		[SerializeField]
		private GameObject levelRoot;

		[SerializeField]
		private GameObject mirrorRoot;

		[SerializeField]
		private TMP_InputField title;

		[SerializeField]
		private TMP_InputField tagTitle;

		[SerializeField]
		private TMP_InputField description;

		[SerializeField]
		private TextMeshProUGUI type;

		[SerializeField]
		private TextMeshProUGUI tier;

		[SerializeField]
		private TextMeshProUGUI race;

		[SerializeField]
		private TMP_InputField x;

		[SerializeField]
		private TMP_InputField z;

		[SerializeField]
		private TextMeshProUGUI rot;

		[SerializeField]
		private TextMeshProUGUI height;

		[SerializeField]
		private Toggle mirror;

		[SerializeField]
		private Slider rotSlider;

		[SerializeField]
		private Slider heightSlider;

		private PropName busu;

		private string busv;

		private string busw;

		private string busx;

		private int busz;

		private Vector3 buta;

		private bool butb;

		private int butc;

		private Dictionary<int, string> butd;

		public void Update()
		{
		}

		public override void nos(bqn a)
		{
		}

		public void nug(PropName a)
		{
		}

		public void UpdateName()
		{
		}

		public void UpdatePosition()
		{
		}

		public void UpdateRotation()
		{
		}

		public void UpdateMirror()
		{
		}

		public void UpdateLevel()
		{
		}

		public void StartDrag(int _val)
		{
		}

		public void EndDrag()
		{
		}
	}
}
