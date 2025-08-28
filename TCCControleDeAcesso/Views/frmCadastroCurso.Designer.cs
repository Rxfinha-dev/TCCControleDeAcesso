namespace TCCControleDeAcesso.Views
{
    partial class frmCadastroCurso
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtId = new System.Windows.Forms.TextBox();
            this.txtNome = new System.Windows.Forms.TextBox();
            this.btnCadastrar = new System.Windows.Forms.Button();
            this.dgvCursos = new System.Windows.Forms.DataGridView();
            this.btnVoltar = new System.Windows.Forms.Button();
            ((System.ComponentModel.ISupportInitialize)(this.dgvCursos)).BeginInit();
            this.SuspendLayout();
            // 
            // txtId
            // 
            this.txtId.Location = new System.Drawing.Point(886, 377);
            this.txtId.Name = "txtId";
            this.txtId.Size = new System.Drawing.Size(171, 20);
            this.txtId.TabIndex = 0;
            this.txtId.Visible = false;
            // 
            // txtNome
            // 
            this.txtNome.Location = new System.Drawing.Point(886, 403);
            this.txtNome.Name = "txtNome";
            this.txtNome.Size = new System.Drawing.Size(171, 20);
            this.txtNome.TabIndex = 1;
            // 
            // btnCadastrar
            // 
            this.btnCadastrar.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnCadastrar.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnCadastrar.Location = new System.Drawing.Point(897, 534);
            this.btnCadastrar.Name = "btnCadastrar";
            this.btnCadastrar.Size = new System.Drawing.Size(150, 50);
            this.btnCadastrar.TabIndex = 2;
            this.btnCadastrar.Text = "CADASTRAR";
            this.btnCadastrar.UseVisualStyleBackColor = true;
            this.btnCadastrar.Click += new System.EventHandler(this.btnCadastrar_Click);
            // 
            // dgvCursos
            // 
            this.dgvCursos.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
            this.dgvCursos.Location = new System.Drawing.Point(695, 590);
            this.dgvCursos.Name = "dgvCursos";
            this.dgvCursos.Size = new System.Drawing.Size(552, 201);
            this.dgvCursos.TabIndex = 3;
            // 
            // btnVoltar
            // 
            this.btnVoltar.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnVoltar.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnVoltar.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnVoltar.Location = new System.Drawing.Point(897, 429);
            this.btnVoltar.Name = "btnVoltar";
            this.btnVoltar.Size = new System.Drawing.Size(150, 50);
            this.btnVoltar.TabIndex = 13;
            this.btnVoltar.Text = "VOLTAR";
            this.btnVoltar.UseVisualStyleBackColor = false;
            this.btnVoltar.Click += new System.EventHandler(this.btnVoltar_Click);
            // 
            // frmCadastroCurso
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_sem_nome__7_;
            this.ClientSize = new System.Drawing.Size(1421, 813);
            this.Controls.Add(this.btnVoltar);
            this.Controls.Add(this.dgvCursos);
            this.Controls.Add(this.btnCadastrar);
            this.Controls.Add(this.txtNome);
            this.Controls.Add(this.txtId);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Name = "frmCadastroCurso";
            this.Text = "frmCadastroCurso";
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            this.Load += new System.EventHandler(this.frmCadastroCurso_Load);
            ((System.ComponentModel.ISupportInitialize)(this.dgvCursos)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox txtId;
        private System.Windows.Forms.TextBox txtNome;
        private System.Windows.Forms.Button btnCadastrar;
        private System.Windows.Forms.DataGridView dgvCursos;
        private System.Windows.Forms.Button btnVoltar;
    }
}